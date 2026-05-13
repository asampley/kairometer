import NotificationWorker from './worker/notifications.ts?worker';

if (Worker) {
	console.log("Workers started");
	new NotificationWorker();
} else {
	console.log("Unable to start workers");
}
