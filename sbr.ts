/*
	P[i][j] = probability that i dice rolls sum of j

 	P[i][j] = for k = 1 to 6.
				p[k] * P[i-1][j-k]
	
	P[1][j] = p[j]   j in (1 to 6)
	P[1][i] = 0 for all i not in (1-6)
	P[0][i] = 0 for all i;

*/

import {unit_manager,
        DiceMode,
        unit_group,
        make_unit_group,
        aacalc_output,
        casualty_1d
        } from "./solve";

function compute_prob_table (N : number, p : number[])  : number[][]
{
	let P : number[][] =[];
	let maxsum = N * 6;
	let minsum = N * 1;

	P[0] = [];
	P[0][0] = 1;
	for (let i = 1; i <= N; i++) { 
		P[i] = [];
		let minv = i * 1;
		let maxv = i * 6;
		for (let j = minv; j <= maxv; j++) {
			if (i == 1) {
				P[i][j] = p[j];
			} else {
				P[i][j] = 0;
				for (let k = 1; k <=6; k++) {
					let ii = j - k;
					let minv2 = minv - 1;
					let maxv2 = maxv - 6;
					if (ii < minv2) {
						continue;
					}
					if (ii > maxv2) {
						continue
					}
					P[i][j] += p[k] * P[i-1][ii];
				}
			}
		}
	}
	return P;
}

class SbrProblem {
	numBombers : number;
	numIPCHitPoints : number;
	verbose_level : number;
	in_progress : boolean;
	diceMode : DiceMode;
	um : unit_manager;
	P : number[][];		// P[i][j] is the probability that i bombers gets j hits.
	phit : number[];		// P[i][j] is the probability that i bombers gets j hits.
	Patt : number[]; 		// probability distribution of attackers (result of aa hits)
							// Patt[i] is the probability that i bombers left
	Pdef : number[];		// probability distribution of defenders (result of sbr run)
							// Pdef[i] is the probability that i defending hit points left.

	constructor(numBombers : number, numIPCHitPoints : number, diceMode : DiceMode,	
			verbose_level : number, in_progress : boolean)  {
		this.numBombers = numBombers;
		this.numIPCHitPoints = numIPCHitPoints;
		this.diceMode = diceMode;
		this.in_progress = in_progress;
		this.P = [];
		this.phit= [];	// probability distribution of 1 dice
		for (let i = 0; i <= numBombers; i++) {
			this.P[i] = [];
		}
		this.Patt = [];
		this.Pdef = [];
		this.um = new unit_manager(verbose_level);
		this.verbose_level = verbose_level;
		if (this.diceMode == "biased") {	
			this.phit = [0, 0.1, 0.2, 0.3, 0.2, 0.1, 0.1];
		} else if (this.diceMode == "standard") {	
			this.phit = [0, 1/6, 1/6, 1/6, 1/6, 1/6, 1/6];
		} else {	// low luck
			this.phit = [0, 0, 0, 0.5, 0.5, 0, 0];
		}
		this.P = compute_prob_table(this.numBombers, this.phit);
	}
	solve() {
		let N = this.numBombers;	
		let aastr = "";
		for (let i = 0; i < N; i++) {
			aastr += "c";
		}
		let aa_data = make_unit_group(this.um, aastr, 2, this.diceMode);
		let M = aa_data.tbl_size;
		for (let i = 0; i <= this.numIPCHitPoints; i++) {
			this.Pdef[i] = 0;
		}
		if (this.verbose_level > 2) {
			console.log(M, "M");
			console.log(this.P, "this.P");
			console.log(this.diceMode, "this.diceMode");
		}
		for (let i = 0 ; i < M; i++) {		// aa hits
			let prob = this.in_progress ? ((i == 0) ? 1.0 : 0.0) : aa_data.get_prob_table(M-1, i);
			if (prob == 0) {
				continue;
			}
			if (this.verbose_level > 2) {
				console.log(i, prob, "i, prob aa hit");
			}
			let n = this.numBombers - i;
			this.Patt[n] = prob;
			let minv = n * 1;
			let maxv = n * 6;
			if (this.verbose_level > 2) {
				console.log(minv, maxv, "minv, maxv");
			}
			for (let j = minv; j <= maxv; j++) {	// hits
				// n bombers gets j hits.
				let prob = this.P[n][j];
				let numIPCHitsRemain = this.numIPCHitPoints - j;
				if (numIPCHitsRemain < 0) {
					numIPCHitsRemain = 0;
				}
				this.Pdef[numIPCHitsRemain] += prob * this.Patt[n];
			}
		}
	}
}

export interface sbr_input {
	diceMode : DiceMode;
	verboseLevel : number;
	numBombers : number;
	industrialComplexHitPoints : number;
	inProgress : boolean;
}

export function sbr( input : sbr_input) : aacalc_output
{
	let problem = new SbrProblem(input.numBombers, input.industrialComplexHitPoints,	
					input.diceMode, input.verboseLevel, input.inProgress);
	problem.solve();
	let prob_att_survives = 0.0;	
	let att_ipc = 0.0;
	let stat = problem.um.get_stat("b");
	let att_cas : casualty_1d[] = [];
	for (let i = 0; i < problem.Patt.length; i++) {	// bombers remain
		let prob = problem.Patt[i];
		if (i > 0) {
			prob_att_survives += prob;
		}
		let bombersLost = problem.numBombers - i;
		let ipcLoss = stat.cost * bombersLost;
		att_ipc += ipcLoss * prob;
		let remain = "";
		let casualty = "";
		for (let j = 0; j < i; j++) {
			remain += "b";
		}
		for (let j = 0; j < bombersLost; j++) {
			casualty += "b";
		}
		let cas : casualty_1d = {
				remain : remain,
				retreat : "",
				casualty : casualty, 
				prob : prob
			}
		if (prob > 0) {
			att_cas.push(cas);
		}
	}
	let prob_def_survives = 0.0;	
	let def_ipc = 0.0;
	let def_cas : casualty_1d[] = [];
	for (let i = 0; i < problem.Pdef.length; i++) {	// ipc's remain
		let prob = problem.Pdef[i];
		let ipcLoss = problem.numIPCHitPoints - i;
		def_ipc += ipcLoss * prob;
		if (i > 0) {
			prob_def_survives += prob;
		}
		let remain = "";
		let casualty = "";
		for (let j = 0; j < i; j++) {
			remain += "p";
		}
		for (let j = 0; j < ipcLoss; j++) {
			casualty += "p";
		}
		let cas : casualty_1d = {
				remain : remain,
				retreat : "",
				casualty : casualty, 
				prob : prob
			}
		if (prob > 0) {
			def_cas.push(cas);
		}
	}
	let output : aacalc_output = {
			attack : { survives : [prob_att_survives, 0, 0], ipcLoss : [att_ipc, 0, 0] },
			defense : { survives : [prob_def_survives, 0, 0], ipcLoss : [def_ipc, 0, 0] },
			casualtiesInfo : [],
			att_cas : att_cas,
			def_cas : def_cas,
			rounds : 1,
			takesTerritory : [0, 0, 0]
	}
	return output;
}


/*
let input : sbr_input = {	
		diceMode : "standard",
		verboseLevel : 3,
		numBombers : 5, 
		industrialComplexHitPoints : 20
	}

let output = sbr(input);

console.log(input);
console.log(output);


*/
