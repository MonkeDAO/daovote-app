export function formatDate(date: Date): string {
	const day = String(date.getUTCDate()).padStart(2, '0');
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const year = date.getUTCFullYear();
	const hours = String(date.getUTCHours()).padStart(2, '0');
	const minutes = String(date.getUTCMinutes()).padStart(2, '0');

	return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

export function getRemainingSeconds(remainingTime: any) {
	const totalSecondsRemaining =
		remainingTime.days * 24 * 60 * 60 +
		remainingTime.hours * 60 * 60 +
		remainingTime.minutes * 60 +
		remainingTime.seconds;
	return totalSecondsRemaining;
}

export function isDefaultDate(date: Date) {
	return date.getTime() === new Date(0).getTime();
}

export function getRemainingTime(targetDate: Date) {
	const now = new Date(
		Date.UTC(
			new Date().getUTCFullYear(),
			new Date().getUTCMonth(),
			new Date().getUTCDate(),
			new Date().getUTCHours(),
			new Date().getUTCMinutes(),
			new Date().getUTCSeconds()
		)
	);
	const diff = targetDate.getTime() - now.getTime();

	if (diff <= 0) {
		return {
			ended: true,
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0
		};
	} else {
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		return {
			ended: false,
			days,
			hours,
			minutes,
			seconds
		};
	}
}

export interface ConvertDateResult {
	utcDate: Date;
	unixTimestamp: number;
  }
  
  
export function convertToUTCDate(input: Date | number): ConvertDateResult {
	let date: Date;
  
	if (typeof input === 'number') {
	  date = new Date(input * 1000); // Convert Unix timestamp to milliseconds
	} else if (input instanceof Date) {
	  date = new Date(input);
	} else {
	  throw new Error('Invalid input type. Expected Date object or number (Unix timestamp).');
	}
  
	const utcDate = new Date(date.getTime());
	let unixTimestamp = Math.floor(utcDate.getTime() / 1000); // Convert back to Unix timestamp (seconds)
  
	if (!utcDate.toString().includes('GMT')) {
	  // Adjust to UTC only if the date is not already in UTC
	  utcDate.setUTCMinutes(utcDate.getUTCMinutes() + utcDate.getTimezoneOffset());
	  unixTimestamp = Math.floor(utcDate.getTime() / 1000); // Update the Unix timestamp after adjustment
	}
  
	return {
	  utcDate,
	  unixTimestamp
	};
  }