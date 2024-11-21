type RetryOptions = {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
};

export async function withRetry<T>(
    fn: () => Promise<T>,
    {
        maxAttempts = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffFactor = 2
    }: RetryOptions = {}
): Promise<T> {
    let lastError: Error | undefined = undefined;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (attempt === maxAttempts) break;

            console.warn(
                `Attempt ${attempt} failed, retrying in ${delay}ms...`,
                error
            );

            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * backoffFactor, maxDelay);
        }
    }

    throw lastError!;
} 