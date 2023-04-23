import { compile } from 'mdsvex';
import { dev } from '$app/environment';
import {
	GH_USER_REPO,
	APPROVED_POSTERS_GH_USERNAME,
	GH_PUBLISHED_TAGS,
	REPO_OWNER
} from './siteConfig';


/** @type {import('./types').ContentItem[]} */
let allBlogposts = [];
/**
 * @type {import("./types").ContentItem[]}
 */
let allProposals = []
// let etag = null // todo - implmement etag header

const MOCK_MD_FROM_SHADOW_DRIVE = `
## Lorem

Lorem is currently extended with the following plugins.
Instructions on how to use them in your application are linked below.

| Plugin | README |
| ------ | ------ |
| Dropbox | [plugins/dropbox/README.md](Link) |
| Medium | [plugins/medium/README.md](Link) |
| Google Analytics | [plugins/googleanalytics/README.md](Link) |
`;
/**
 * @param {string | number} text
 * @returns {string}
 */
function slugify(text) {
	return text
		.toString()                 // Cast to string (optional)
		.normalize('NFKD')          // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
		.toLowerCase()              // Convert the string to lowercase letters
		.trim()                     // Remove whitespace from both sides of a string (optional)
		.replace(/\s+/g, '-')       // Replace spaces with hyphen
		.replace(/[^\w-]+/g, '')   // Remove all non-word chars
		.replace(/--+/g, '-')     // Replace multiple hyphen with single hyphen
		.replace(/(^-|-$)/g, ''); // Remove leading or trailing hyphen
}

/**
 * @param {string} text
 * @returns {string}
 */
function readingTime(text) {
	let minutes = Math.ceil(text.trim().split(' ').length / 225);
	return minutes > 1 ? `${minutes} minutes` : `${minutes} minute`;
}


/**
 * @param {Function} providedFetch from sveltekit
 * @returns {Promise<import('./types').ContentItem[]>}
 */
export async function listContent(providedFetch) {
	// use a diff var so as to not have race conditions while fetching
	// TODO: make sure to handle this better when doing etags or cache restore

	/** @type {import('./types').ContentItem[]} */
	let _allProposals = [
		{ id: 1, title: 'Should MonkeDAO acquire SMB IP?', description: 'Vote is lorem ipsum ok now thats great', content: MOCK_MD_FROM_SHADOW_DRIVE },
		{ id: 2, title: 'Should HADES be bought in bulk?', description: 'Vote is lorem ipsum ok now thats great', content: MOCK_MD_FROM_SHADOW_DRIVE },
		{ id: 3, title: 'Vote out the Dev Experts', description: 'Vote is lorem ipsum ok now thats great', content: MOCK_MD_FROM_SHADOW_DRIVE },
	];;
	let next = null;
	let limit = 0; // just a failsafe against infinite loop - feel free to remove
	// const authheader = process.env.GH_TOKEN && {
	// 	Authorization: `token ${process.env.GH_TOKEN}`
	// };
	// let url =
	// 	`https://api.github.com/repos/${GH_USER_REPO}/issues?` +
	// 	new URLSearchParams({
	// 		state: 'all',
	// 		labels: GH_PUBLISHED_TAGS.toString(),
	// 		per_page: '100',
	// 	});
	// // pull issues created by owner only if allowed author = repo owner
	// if (APPROVED_POSTERS_GH_USERNAME.length === 1 && APPROVED_POSTERS_GH_USERNAME[0] === REPO_OWNER) {
	// 	url += '&' + new URLSearchParams({ creator: REPO_OWNER });
	// }
	// do {
	// 	const res = await providedFetch(next?.url ?? url, {
	// 		headers: authheader
	// 	});

	// 	const issues = await res.json();
	// 	if ('message' in issues && res.status > 400)
	// 		throw new Error(res.status + ' ' + res.statusText + '\n' + (issues && issues.message));
	// 	issues.forEach(
	// 		/** @param {import('./types').GithubIssue} issue */
	// 		(issue) => {
	// 			if (
	// 				// labels check not needed anymore as we have set the labels param in github api
	// 				// issue.labels.some((label) => GH_PUBLISHED_TAGS.includes(label.name)) &&
	// 				APPROVED_POSTERS_GH_USERNAME.includes(issue.user.login)
	// 			) {
	// 				_allBlogposts.push(parseIssue(issue));
	// 			}
	// 		}
	// 	);
	// 	const headers = parse(res.headers.get('Link'));
	// 	next = headers && headers.next;
	// } while (next && limit++ < 1000); // just a failsafe against infinite loop - feel free to remove
	// _allProposals.sort((a, b) => b.closing_date.valueOf() - a.closing_date.valueOf()); // use valueOf to make TS happy https://stackoverflow.com/a/60688789/1106414
	allProposals = _allProposals;
	return allProposals;
}

/**
 * @param {Function} providedFetch from sveltekit
 * @param {string} slug of the file to retrieve
 * @returns {Promise<import('./types').ContentItem>}
 */
export async function getContent(providedFetch, slug) {
	// get all blogposts if not already done - or in development
	if (dev || allProposals.length === 0) {
		console.log('loading allProposals');
		allBlogposts = await listContent(providedFetch);
		console.log('loaded ' + allProposals.length + ' proposals');
		if (!allProposals.length)
			throw new Error(
				'failed to load proposals for some reason. check'
			);
	}
	if (!allProposals.length) throw new Error('no proposals');
	// find the blogpost that matches this slug
	console.log("\n\t---getContent Mark #1---\t\n");
	const proposal = allProposals.find((proposal) => `${proposal.id}` === slug);
	// const blogpost = allBlogposts.find((post) => post.slug === slug);
	if (proposal) {
		const compiledResponse = await compile(MOCK_MD_FROM_SHADOW_DRIVE);
		proposal.content = compiledResponse?.code;

		console.log("\n\t---getContent Mark #2---\t\n", compiledResponse?.code);

		return proposal;
	} else {
		throw new Error('Blogpost not found for slug: ' + slug);
	}
}

export async function getCreateContent(providedFetch, slug) {
	// get all blogposts if not already done - or in development
	console.log("\n\t---getCreateContent Mark #1---\t\n");
	if (slug && slug === 'proposal') {
		return {
			title: 'Create Proposals',
			description: 'Create Proposals',
		}
	}
	else {
		throw new Error('Not found for slug: ' + slug);
	}
}