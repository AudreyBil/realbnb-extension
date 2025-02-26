//Format Open AI Analysis
function formatAnalysisResult(analysis) {

	//If analysis was not successful, return an error message
	if (analysis.toLowerCase().includes("not enough data")) {
		return `There is not enough information on this listing in order to analyse it.`
	}

	//Split into lines: split the analysis for each newline and store them in an array of line
	//Then, trim the line to remove any extra whitespace character
	const lines = analysis.split('\n').map(line => line.trim());

	// Find the score line specifically with the find method
	const scoreLine = lines.find(line => line.toLowerCase().startsWith('score:'));
	if (!scoreLine) {
		console.error('No score line found in:', analysis);
		return '<div class="error">Invalid analysis format</div>';
	}

	// Extract score from the score line
	const scoreMatch = scoreLine.match(/(\d+)%/);
	const score = scoreMatch ? scoreMatch[1] : "N/A";

	// Start collecting factors from after the score line
	const scoreLineIndex = lines.findIndex(line => line.toLowerCase().startsWith('score:'));
	const factors = lines
		.slice(scoreLineIndex + 1)  // Start from after score line
		.filter(line => line.trim().startsWith('+') || line.trim().startsWith('-'))  // Only take factors with + or -
		.map(line => ({
			text: line.substring(1).trim(),  // Remove the + or - and trim
			isPositive: line.startsWith('+')
		}));

	console.log('Parsed result:', { score, factors });  // Debug log

	return `
		<div class="result">
			<div class="score">
				<span class="score-number">${score}%</span>
				<span class="score-label">Lived-In Probability</span>
			</div>
			<div class="keywords">
				${factors.map(factor =>
					`<span class="keyword ${factor.isPositive ? 'positive' : 'negative'}">${factor.text}</span>`
				).join('')}
			</div>
		</div>
	`;
}
