//Format Open AI Analysis
export function formatAnalysisResult(analysis) {

	//If analysis was not successful, return an error message
	if ((analysis.toLowerCase().includes("sorry") ||
	analysis.toLowerCase().includes("I can't assist")) && !analysis.includes("Score:")) {
		return '<div class="error">Open AI could not run the analysis. Try again.</div>';
	}

	//Split into lines: split the analysis for each newline and store them in an array of line
	//Then, trim the line to remove any extra whitespace character
	const lines = analysis.split('\n').map(line => line.trim());

	// Find the score line specifically with the find method
	const scoreLine = lines.find(line => line.toLowerCase().includes('score:'));
	if (!scoreLine) {
		console.error('No score line found in:', analysis);
		return '<div class="error">Open AI could not run the analysis. Try again.</div>';
	}

	// Extract score from the score line
	const scoreMatch = scoreLine.match(/(\d+)%/);
	const score = scoreMatch ? scoreMatch[1] : "N/A";

	// Start collecting factors from after the score line
	const scoreLineIndex = lines.indexOf(scoreLine);
	const factors = lines
		.slice(scoreLineIndex + 1)  // Create a new array starting from the line following the score line
		.filter(line => line.trim().startsWith('+') || line.trim().startsWith('-'))  // Create a new array with only lines starting with + or - (trim the whitespace first)
		.map(line => ({ //Create an array by applying a transformation function to each factor and turning each of them into an object with two properties
			text: line.substring(1).trim(),  // Remove the + or - by extracting all characters from index 1, and trim whitespaces
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
	//use join method to combine all the strings from the array into a single string so it creates a proper HTML string that can be inserted into the DOM
}
