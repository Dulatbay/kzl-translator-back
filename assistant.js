require('dotenv').config();


// singleton
const {OpenAI} = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const assistantId = process.env.ASSISTANT_ID;

class Assistant {
    static assistant = null
    static thread = null;

    async getAssistant() {
        if (!Assistant.assistant)
            Assistant.assistant = openai.beta.assistants.retrieve(assistantId)
        return Assistant.assistant;
    }

    async #getThread() {
        if (!Assistant.thread)
            Assistant.thread = await openai.beta.threads.create();
        return Assistant.thread;
    }

    async sendMessage(msg) {
        const thread = await this.#getThread();
        const assistant = await this.getAssistant();

        console.log('Assistant fetched', assistant);
        console.log('Thread fetched', thread);


        const message = await openai.beta.threads.messages.create(
            thread.id,
            {
                role: "user",
                content: msg
            }
        );

        let run = await openai.beta.threads.runs.createAndPoll(
            thread.id,
            {
                assistant_id: assistant.id,
            }
        );

        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(
                run.thread_id
            );

            return messages.data[0];
        } else {
            console.log(run)
        }
    }

    async sendMessageWithStreaming(msg, res) {
        const thread = await this.#getThread();
        const assistant = await this.#getAssistant();

        console.log('Assistant fetched', assistant);
        console.log('Thread fetched', thread);

        let finalResponse = '';

        const message = await openai.beta.threads.messages.create(
            thread.id,
            {
                role: "user",
                content: msg
            }
        );

        const run = openai.beta.threads.runs.stream(thread.id, {
            assistant_id: assistant.id
        })
            .on('textDelta', (textDelta, snapshot) => {
                finalResponse += textDelta.value;
            })
            .on('end', () => {
                res.send(finalResponse);
            })
            .on('error', (err) => {
                console.error('Error while streaming:', err);
                res.status(500).send('Something went wrong while streaming!');
            });
    }
}

module.exports = Assistant;