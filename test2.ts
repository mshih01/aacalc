
import * as readline from 'readline';

import {unit_manager, make_unit_group_string
		} from "./solve";

import {UnitIdentifier, UnitSubgroup, 
		MultiwaveInput, WaveInput, UnitGroup, multiwaveExternal } from "./external";


const stdin: any = process.stdin;

const epsilon : number = 1e-9;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let argc : number  = 0;
let argv : string[] = [];

rl.on('line', (line) => {
	argv[argc++] = line;
});

rl.once('close', () => {
	console.log("done");
	let mode = parseInt(argv[0]);
	switch(mode) {
		case 0: 
			break;
		case 1: 
			break;
		case 2: 
			// example parse unit iniput
			run4(argc, argv);
			break;
	}
 });

function run4(argc : number, argv : string[]) 
{
	let i = 1;
	let N = parseInt(argv[i++]);		// number of units

	let units : UnitSubgroup[] = [];	
	let ool : UnitIdentifier[] = [];

	let um = new unit_manager();
	for (let j = 0; j < N; j++) {
		let uname = argv[i++];
		let count = parseInt(argv[i++]);
		
		let ch = um.rev_map2.get(uname);
		if (ch == undefined) {
			console.log(ch, "units");
			throw new Error("rev_map3 failed");
		}
		let stat = um.get_stat(ch);
		if (stat == undefined) {
			throw new Error("stat failed");
		}
		let unit : UnitSubgroup = { unitId : stat.id, count: count };
		units.push(unit);
	}

	let M = parseInt(argv[i++]);		// number of ool entries
	for (let j = 0; j < M; j++) {
		let uname = argv[i++];
		let ch = um.rev_map2.get(uname);
		if (ch == undefined) {
			console.log(ch, "ool");
			throw new Error("rev_map3 failed");
		}
		let stat = um.get_stat(ch);
		if (stat == undefined) {
			throw new Error("stat failed");
		}
		ool.push(stat.id);
	}
	let takes = parseInt(argv[i++]);
	let aalast = parseInt(argv[i++]) > 9;
	let isnaval = parseInt(argv[i++]) > 0;
	
	console.log(units, "units");
	console.log(ool, "ool");
	console.log(takes, "takes");
	console.log(aalast, "aalast");
	console.log(isnaval, "isnaval");
	let unitstr = make_unit_group_string(
		units, ool, takes, aalast, isnaval);

	console.log(unitstr, "unit_str, ool_str");

	let input : MultiwaveInput;
	let waves : WaveInput[] = [];
	let wave : WaveInput;
	let att : UnitGroup;
	let def : UnitGroup;
	att = {	
		units : units,
		ool : ool,
		takes : takes,	
		aaLast : false
	}
	def = {	
		units : units,
		ool : ool,
		takes : 0,	
		aaLast : aalast
	}
	
	wave = {
		attack : att,
		defense : def,
		att_submerge : false,
		def_submerge : false,
		att_dest_last : false,
		def_dest_last : false,
		retreat_threshold : 0
	}
	
	waves.push(wave);
	input = {
		wave_info : waves,
		debug : false,
		prune_threshold : 1e-12,	
		report_prune_threshold : 1e-12,	
		is_naval : isnaval,
		num_runs : 1
	}
		
	console.log(JSON.stringify(input, null, 4));
	let output = multiwaveExternal(input);
	console.log(JSON.stringify(input, null, 4));
	console.log(JSON.stringify(output, null, 4));
}

