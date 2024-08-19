
import * as readline from 'readline';

import {unit_manager, 
		multiwave_input, wave_input, multiwave,
		aacalc_input, aacalc_output, aacalc} from "./solve";

import {UnitIdentifier, UnitSubgroup,
		make_unit_group_string,
		UnitIdentifier2UnitMap, 
		Unit2UnitIdentifierMap,
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
            run2(argc, argv);
            break;
        case 1:
            run3(argc, argv);
            break;
        case 2:
            run4(argc, argv);
            // example parse unit iniput
            break;
    }
 });



function run3(argc : number, argv : string[]) 
{
	let i = 1;
	let debug = parseInt(argv[i++]);
	let report_prune_threshold = parseFloat(argv[i++]);
	let prune_threshold = parseFloat(argv[i++]);
	let early_prune_threshold = prune_threshold/ 10;
	let isnaval = parseInt(argv[i++]);
	let attackers = argv[i++];
	let defenders = argv[i++];
	
	let strafe_threshold = parseFloat(argv[i++]);
	let num_runs = Math.max(parseInt(argv[i++]), 1);

	let att_destroyer_last = 0;
	let def_destroyer_last = 0;
	let att_submerge = 0;
	let def_submerge = 0;
	if (isnaval > 0) {
		att_destroyer_last = Math.max(parseInt(argv[i++]), 0);
		att_submerge = Math.max(parseInt(argv[i++]), 0);
		def_destroyer_last = Math.max(parseInt(argv[i++]), 0);
		def_submerge = Math.max(parseInt(argv[i++]), 0);
	}
	let attackers2 = argv[i++];
	let defenders2 = argv[i++];
	let def_ool2 = argv[i++];
	let attackers3 = argv[i++];
	let defenders3 = argv[i++];
	let def_ool3 = argv[i++];
	let in_progress = parseInt(argv[i++]) > 0;
	let retreat1 = parseInt(argv[i++]);
	let retreat2 = parseInt(argv[i++]);
	let retreat3 = parseInt(argv[i++]);

	console.time('Execution Time');

	let input : multiwave_input;
	let wave1 : wave_input;
	let wave2 : wave_input;
	let wave3 : wave_input;
	let wavearr : wave_input[] = [];
	
	wave1 = { attacker : attackers, 
			  defender : defenders,
			  def_ool : "",
			  att_submerge : false,
			  def_submerge : false,
			  att_dest_last : false,
			  def_dest_last : false,
			  retreat_threshold : retreat1 };
	wave2 = { attacker : attackers2, 
			  defender : defenders2,
			  def_ool : def_ool2,
			  att_submerge : false,
			  def_submerge : false,
			  att_dest_last : false,
			  def_dest_last : false,
			  retreat_threshold : retreat2};
	wave3 = { attacker : attackers3, 
			  defender : defenders3,
			  def_ool : def_ool3,
			  att_submerge : false,
			  def_submerge : false,
			  att_dest_last : false,
			  def_dest_last : false,
			  retreat_threshold : retreat3 };
	wavearr.push(wave1);
	if (attackers2.length > 0) {
		wavearr.push(wave2);
	}
	if (attackers3.length > 0) {
		wavearr.push(wave3);
	}

	input = {
		wave_info : wavearr,
		debug	: debug > 0,
		prune_threshold : prune_threshold,
		report_prune_threshold : report_prune_threshold,
		is_naval : isnaval > 0,
		num_runs	: num_runs
		}
			  	
	console.log("input", input);
	
	let output = multiwave(input) 

	console.log ("output", output)
	console.log ("out", output.out)

	console.timeEnd('Execution Time');
}


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
		let id = Unit2UnitIdentifierMap.get(ch);
		if (id == undefined) {
			throw new Error("id failed");
		}
		let unit : UnitSubgroup = { unitId : id, count: count };
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
		let id = Unit2UnitIdentifierMap.get(ch);
		if (id == undefined) {
			throw new Error("id failed");
		}
		ool.push(id);
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


function run2(argc : number, argv : string[]) {
	let i = 1;
	let debug = parseInt(argv[i++]);
	let report_prune_threshold = parseFloat(argv[i++]);
	let prune_threshold = parseFloat(argv[i++]);
	let early_prune_threshold = prune_threshold/ 10;
	let isnaval = parseInt(argv[i++]);
	let attackers = argv[i++];
	let defenders = argv[i++];
	
	let strafe_threshold = parseFloat(argv[i++]);
	let num_runs = Math.max(parseInt(argv[i++]), 1);
	let retreat_threshold = parseInt(argv[i++]);
	let in_progress = parseInt(argv[i++]) > 0;

	let att_destroyer_last = 0;
	let def_destroyer_last = 0;
	let att_submerge = 0;
	let def_submerge = 0;
	if (isnaval > 0) {
		att_destroyer_last = Math.max(parseInt(argv[i++]), 0);
		att_submerge = Math.max(parseInt(argv[i++]), 0);
		def_destroyer_last = Math.max(parseInt(argv[i++]), 0);
		def_submerge = Math.max(parseInt(argv[i++]), 0);
	}

	console.time('Execution Time');
	console.log(`debug = ${debug}`);
	console.log(`report_prune_threshold = ${report_prune_threshold}`);
	console.log(`prune_threshold = ${prune_threshold}`);
	console.log(`isnaval = ${isnaval}`);
	console.log(`in_progress = ${in_progress}`);
	console.log(`attackers = ${attackers}`);
	console.log(`defenders = ${defenders}`);
	console.log(`strafe_threshold = ${strafe_threshold}`);
	console.log(`retreat_threshold = ${retreat_threshold}`);
	console.log(debug);

	let input : aacalc_input;
	input = { attacker: attackers, defender: defenders, debug : debug > 0, prune_threshold : prune_threshold, 
			report_prune_threshold : report_prune_threshold, is_naval : isnaval > 0, 
			is_in_progress : in_progress,
			att_destroyer_last : att_destroyer_last > 0, 
			def_destroyer_last : att_destroyer_last > 0, 
			att_submerge_sub : att_submerge > 0, 
			def_submerge_sub : def_submerge > 0, 
			num_runs : num_runs,
			retreat_threshold : retreat_threshold,
			strafe_threshold : -1,
			strafe_attpower_threshold : 0,
			strafe_num_threshold : 0,
			strafe_do_attpower_check : false,
			strafe_do_num_check : false
			 }
	console.log("input", input);
	
	let output = aacalc(input) 

	console.log ("output", output)
    console.log ("casualtiesInfo", JSON.stringify(output.casualtiesInfo, null, 4))
    console.log ("att_cas", JSON.stringify(output.att_cas, null, 4))
    console.log ("def_cas", JSON.stringify(output.def_cas, null, 4))

	console.timeEnd('Execution Time');
}

