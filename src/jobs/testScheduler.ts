export default async function testScheduler(): Promise<void> {
    const now = new Date();
    console.log(`It is ${now.toLocaleString()}... running next time in 30 seconds...`);
}