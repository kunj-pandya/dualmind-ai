import OpenAI from "openai";
import connectDB from "../../../lib/db";
import Conversation from "../../../models/Conversation";


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {

    console.log("🔥 /api/chat-stream HIT");

    try {
        await connectDB();

        const { message, conversationId } = await request.json();

        if (!message) {
            return new Response(
                JSON.stringify({ error: "Message body is missing." }),
                { status: 400 }
            );
        }

        // Find or create conversation
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        }

        if (!conversation) {
            conversation = await Conversation.create({ messages: [] });
            console.log("✅ New Conversation Created:", conversation._id);
        } else {
            console.log("🔍 Found Conversation:", conversation._id);
        }

        // Save User Message
        const userMessage = { role: "user", content: message };
        conversation.messages.push(userMessage);
        await conversation.save();

        // Prepare context (Last 10 messages)
        const history = conversation.messages.slice(-10).map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));

        // Send to OpenAI
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: history,
            stream: true,
        });

        const encoder = new TextEncoder();
        let assistantMessageContent = "";

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            assistantMessageContent += content;
                            controller.enqueue(encoder.encode(content));
                        }
                    }

                    // Save Assistant Message when stream ends
                    conversation.messages.push({
                        role: "assistant",
                        content: assistantMessageContent,
                    });
                    await conversation.save();
                    console.log("📝 Assistant Message Saved");

                } catch (err) {
                    controller.error(err);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "x-conversation-id": conversation._id.toString(),
            },
        });

    } catch (error) {
        console.error("OpenAI API Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500 }
        );
    }
}
