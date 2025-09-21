import AIProcessor from './aiProcessor';

interface QueueItem {
    interaction: any;
    processing: boolean;
}

class QueueManager {
    private queue: { [interactionId: string]: QueueItem } = {};
    private interval: NodeJS.Timeout | undefined;
    private static readonly CONCURRENT_QUEUE_SIZE = 3;

    addItem(interaction: any) {
        this.queue[interaction.id] = {
            interaction: interaction,
            processing: false
        };

        if (!this.interval) {
            this.startQueue();
        }
    }

    removeItem(interactionId: string) {
        delete this.queue[interactionId];
    }

    isEmpty() {
        return Object.keys(this.queue).length === 0;
    }

    private startQueue() {
        this.interval = setInterval(() => this.processQueue(), 3000);
    }

    private stopQueue() {
        clearInterval(this.interval);
        this.interval = undefined;
    }

    private async processQueue() {
        if (this.isEmpty()) {
            this.stopQueue();
            return;
        }

        const items = Object.values(this.queue);
        let processingCount = 0;

        for (const item of items) {
            if (item.processing) {
                processingCount++;
            } else if (processingCount < QueueManager.CONCURRENT_QUEUE_SIZE) {
                item.processing = true;
                this.processTask(item.interaction);
                processingCount++;
            }
        }
    }

    private async processTask(interaction: any) {
        const prompt = interaction.options.getString("input");
        console.log(`Processing: ${prompt}`);

        try {
            const result = await AIProcessor.processPrompt(prompt);
            console.log(`Task complete: ${interaction.id}`);
            await interaction.editReply(result);
            this.removeItem(interaction.id);
        } catch (error) {
            console.error('Error:', error);
            await interaction.editReply("An error occurred while processing your request. Please try again later.");
            this.removeItem(interaction.id);
        }
    }
}

export default QueueManager;
