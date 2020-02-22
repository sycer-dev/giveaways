declare module 'discord-akairo' {
	export const Constants: {
		AkairoHandlerEvents: {
			LOAD: 'load';
			REMOVE: 'remove';
		};
		CommandHandlerEvents: {
			MESSAGE_BLOCKED: 'messageBlocked';
			MESSAGE_INVALID: 'messageInvalid';
			COMMAND_BLOCKED: 'commandBlocked';
			COMMAND_STARTED: 'commandStarted';
			COMMAND_FINISHED: 'commandFinished';
			COMMAND_CANCELLED: 'commandCancelled';
			COMMAND_LOCKED: 'commandLocked';
			MISSING_PERMISSIONS: 'missingPermissions';
			COOLDOWN: 'cooldown';
			IN_PROMPT: 'inPrompt';
			ERROR: 'error';
		};
	};
}
