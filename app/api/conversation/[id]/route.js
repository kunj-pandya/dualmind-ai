import connectDB from "../../../../lib/db";
import Conversation from "../../../../models/Conversation";

export async function GET(request, { params }) {
    try {
        await connectDB();

        const conversation = await Conversation.findById(params.id);

        if (!conversation) {
            return new Response(
                JSON.stringify({ error: "Conversation not found" }),
                { status: 404 }
            );
        }

        return new Response(
            JSON.stringify({ messages: conversation.messages }),
            { status: 200 }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500 }
        );
    }
}
