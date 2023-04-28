<script>
	import ProposalView from '../../../../../components/Proposal/ProposalView.svelte';
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	const proposal = {
		poster: 'solanaPublicKey',
		data: {
			title: 'my title',
			summary: 'short description',
			url: 'https://shdw-drive.genesysgo.net/7tzG4aT5kQZUpnFyvs4WC76Bm6dCN544cPLRogvFXJoU/a4%20(3).pdf'
		},
		options: [
			{ id: 1, title: 'Yes' },
			{ id: 2, title: 'No' }
		],
		maxOptionsSelectable: 1,
		settings: [{ ownerInfo: [Object] }],
		voterCount: 0,
		voteOpen: true,
		proposalId: 12
	};
</script>

<ProposalView {proposal} />
