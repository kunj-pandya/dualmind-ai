import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
    try {
        const { message } = await request.json();

        if (!message) {
            return new Response(
                JSON.stringify({ error: "Message body is missing." }),
                { status: 400 }
            );
        }

        // Create streaming completion
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: message }],
            stream: true,
        });

        const encoder = new TextEncoder();

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            controller.enqueue(encoder.encode(content));
                        }
                    }
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












// import { GoogleGenerativeAI } from "@google/generative-ai";

// const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// export async function POST(request) {
//     try {
//         const { message } = await request.json();

//         if (!message) {
//             return new Response(JSON.stringify({ error: "Message body is missing." }), {
//                 status: 400,
//             });
//         }

//         const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

//         // Use streaming version
//         const streamResult = await model.generateContentStream(message);

//         // Set up a ReadableStream for browser streaming
//         const encoder = new TextEncoder();

//         const stream = new ReadableStream({
//             async start(controller) {
//                 for await (const chunk of streamResult.stream) {
//                     const chunkText = chunk.text();
//                     if (chunkText) {
//                         controller.enqueue(encoder.encode(chunkText));
//                     }
//                 }
//                 controller.close();
//             },
//         });

//         // Return stream with proper headers
//         return new Response(stream, {
//             headers: {
//                 "Content-Type": "text/plain; charset=utf-8",
//             },
//         });
//     } catch (error) {
//         console.error("Gemini API Error:", error);
//         return new Response(JSON.stringify({ error: error.message }), {
//             status: 500,
//         });
//     }
// }
