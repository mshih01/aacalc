
import * as readline from 'readline';

import {unit_manager, 
		DiceMode,
		} from "./solve";

import {UnitIdentifier, 
		Army,
		Unit2UnitIdentifierMap,
		make_unit_group_string,
		SbrInput, sbrExternal,
		MultiwaveInput, WaveInput, UnitGroup, multiwaveExternal } from "./external";


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let argc : number  = 0;
const argv : string[] = [];

rl.on('line', (line) => {
	argv[argc++] = line;
});

rl.once('close', () => {
	console.log("done");
	const mode = parseInt(argv[0]);
	switch(mode) {
		case 0: 
			break;
		case 1: 
			break;
		case 2: 
			// example parse unit iniput
			run4(argc, argv);
			break;
		case 3: 
			// example parse unit iniput
			run5(argc, argv);
			break;
	}
 });

function run4(argc : number, argv : string[]) 
{
	let i = 1;
	const verbose_level = parseInt(argv[i++]);
	const N = parseInt(argv[i++]);		// number of units

	const units : Army = {};
	const ool : UnitIdentifier[] = [];
	const units2 : Army = {};
	const ool2 : UnitIdentifier[] = [];

	const um = new unit_manager( verbose_level);
	for (let j = 0; j < N; j++) {
		const uname = argv[i++];
		const count = parseInt(argv[i++]);
		
		const ch = um.rev_map2.get(uname);
		if (ch == undefined) {
			console.log(ch, "units");
			throw new Error("rev_map3 failed");
		}
        const id = Unit2UnitIdentifierMap.get(ch);
        if (id == undefined) {
            throw new Error("id failed");
        }
		units[id] = count;
	}

	const M = parseInt(argv[i++]);		// number of ool entries
	for (let j = 0; j < M; j++) {
		const uname = argv[i++];
		const ch = um.rev_map2.get(uname);
		if (ch == undefined) {
			console.log(ch, "ool");
			throw new Error("rev_map3 failed");
		}
        const id = Unit2UnitIdentifierMap.get(ch);
        if (id == undefined) {
            throw new Error("id failed");
        }
		ool.push(id);
	}
	const N2 = parseInt(argv[i++]);		// number of units
	for (let j = 0; j < N2; j++) {
		const uname = argv[i++];
		const count = parseInt(argv[i++]);
		
		const ch = um.rev_map2.get(uname);
		if (ch == undefined) {
			console.log(ch, "units");
			throw new Error("rev_map3 failed");
		}
        const id = Unit2UnitIdentifierMap.get(ch);
        if (id == undefined) {
            throw new Error("id failed");
        }
		units2[id] = count;
	}
	const M2 = parseInt(argv[i++]);		// number of ool entries
	for (let j = 0; j < M2; j++) {
		const uname = argv[i++];
		const ch = um.rev_map2.get(uname);
		if (ch == undefined) {
			console.log(ch, "ool");
			throw new Error("rev_map3 failed");
		}
        const id = Unit2UnitIdentifierMap.get(ch);
        if (id == undefined) {
            throw new Error("id failed");
        }
		ool2.push(id);
	}
	const takes = parseInt(argv[i++]);
	const aalast = parseInt(argv[i++]) > 0;
	const isnaval = parseInt(argv[i++]) > 0;
	const rounds = parseInt(argv[i++]);
	const retreat_threshold = parseInt(argv[i++]);
	const crash = parseInt(argv[i++]) >  0;
	const diceMode = parseInt(argv[i++]);
	
	const diceArr : DiceMode[] = []
	diceArr.push("standard");
	diceArr.push("biased");
	diceArr.push("lowluck");
	
	console.log(units, "units");
	console.log(ool, "ool");
	console.log(takes, "takes");
	console.log(aalast, "aalast");
	console.log(isnaval, "isnaval");
	const unitstr = make_unit_group_string(
		units, ool, takes, aalast, isnaval, verbose_level);
	const unitstr2 = make_unit_group_string(
		units2, ool2, takes, aalast, isnaval, verbose_level);

	console.log(unitstr, "unit_str, ool_str");
	console.log(unitstr2, "unit_str, ool_str");

	const waves : WaveInput[] = [];
	const att : UnitGroup = {	
		units : units,
		ool : ool,
		takes : takes,	
		aaLast : false
	}
	const def : UnitGroup = {	
		units : units2,
		ool : ool2,
		takes : 0,	
		aaLast : aalast
	}
	
	const wave : WaveInput = {
		attack : att,
		defense : def,
		att_submerge : false,
		def_submerge : false,
		att_dest_last : false,
		def_dest_last : false,
		is_crash_fighters : crash,
		rounds : rounds,
		retreat_threshold : retreat_threshold
	}
	
	waves.push(wave);
	const input : MultiwaveInput = {
		wave_info : waves,
		debug : false,
		prune_threshold : 1e-12,	
		report_prune_threshold : 1e-12,	
		is_naval : isnaval,
		in_progress : false, 
		num_runs : 1,
		verbose_level : verbose_level,
		diceMode : diceArr[diceMode]
	}
		
	console.log(JSON.stringify(input, null, 4));
	const output = multiwaveExternal(input);
	console.log(JSON.stringify(input, null, 4));
	console.log(JSON.stringify(output, null, 4));
}

function run5(argc : number, argv : string[]) 
{
	let i = 1;
	const verbose_level = parseInt(argv[i++]);
	const N = parseInt(argv[i++]);		// number of units

	const units : Army = {};
	const ool : UnitIdentifier[] = [];
	const units2 : Army = {};
	const ool2 : UnitIdentifier[] = [];

	const um = new unit_manager( verbose_level);
	for (let j = 0; j < N; j++) {
		const uname = argv[i++];
		const count = parseInt(argv[i++]);
		
		const ch = um.rev_map2.get(uname);
		if (ch == undefined) {
			console.log(ch, "units");
			throw new Error("rev_map3 failed");
		}
        const id = Unit2UnitIdentifierMap.get(ch);
        if (id == undefined) {
            throw new Error("id failed");
        }
		units[id] = count;
		ool.push(id);
	}

	const N2 = parseInt(argv[i++]);		// number of units
	for (let j = 0; j < N2; j++) {
		const uname = argv[i++];
		const count = parseInt(argv[i++]);
		
		const ch = um.rev_map2.get(uname);
		if (ch == undefined) {
			console.log(ch, "units");
			throw new Error("rev_map3 failed");
		}
        const id = Unit2UnitIdentifierMap.get(ch);
        if (id == undefined) {
            throw new Error("id failed");
        }
		units2[id] = count;
		ool2.push(id);
	}
	const diceMode = parseInt(argv[i++]);
	const in_progress = parseInt(argv[i++]) > 0;
	
	const diceArr : DiceMode[] = []
	diceArr.push("standard");
	diceArr.push("biased");
	diceArr.push("lowluck");
	
	const takes = 0;
	const aalast = false;
	const isnaval = false;
	const unitstr = make_unit_group_string(
		units, ool, takes, aalast, isnaval, verbose_level);
	const unitstr2 = make_unit_group_string(
		units2, ool2, takes, aalast, isnaval, verbose_level);

	console.log(unitstr, "unit_str, ool_str");
	console.log(unitstr2, "unit_str, ool_str");

	const att : UnitGroup = {	
		units : units,
		ool : ool,
		takes : takes,	
		aaLast : false
	}
	const def : UnitGroup = {	
		units : units2,
		ool : ool2,
		takes : 0,	
		aaLast : aalast
	}
	
	const input : SbrInput = {
		verbose_level : verbose_level,
		diceMode : diceArr[diceMode],
		attack : att,
		defense : def,
		in_progress : in_progress,
		reportPruneThreshold : 1e-12,
		pruneThreshold : 1e-12,
	}
		
	console.log(JSON.stringify(input, null, 4));
	const output = sbrExternal(input);
	console.log(JSON.stringify(input, null, 4));
	console.log(JSON.stringify(output, null, 4));
}
