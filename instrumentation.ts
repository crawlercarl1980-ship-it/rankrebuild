export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Catch ALL unhandled rejections and exceptions to prevent server crash
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[RankRebuild] Unhandled Rejection at:', promise, 'reason:', reason);
      // Do NOT exit - just log it
    });

    process.on('uncaughtException', (error) => {
      console.error('[RankRebuild] Uncaught Exception:', error.message);
      // Do NOT exit - just log it (unless it's fatal)
      if (error.message?.includes('EADDRINUSE')) {
        console.error('[RankRebuild] Port in use - exiting');
        process.exit(1);
      }
    });

    console.log('[RankRebuild] Error handlers registered - server crash prevention active');
  }
}
