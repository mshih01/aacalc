/* eslint-disable */

import {unit_manager, 
		DiceMode,
		apply_ool,
        multiwave_input, wave_input, multiwave,
		get_cost_from_str } from "./solve";
import {sbr, sbr_input } from "./sbr";

export type UnitIdentifier = "aa" | "inf" | "art" | "arm" | "fig" | "bom" | "sub" | "tra" | "des" | "cru" | "acc" | "bat" | "bat1" | "dbat" | "ic" | "inf_a" | "art_a" | "arm_a";

export type Army = Partial<Record<UnitIdentifier, number>>;

export const  UnitIdentifier2UnitMap : Record<UnitIdentifier, string> = {
		aa: "c", inf: "i", art: "a", arm: "t", fig: "f", bom: "b", sub : "S", tra: "T", des: "D", cru: "C", acc: "A", bat: "B", dbat: "F", 
		ic : "p", inf_a: "j", art_a : "g", arm_a : "u", bat1: "B"}

export const  Unit2UnitIdentifierMap = new Map<string, UnitIdentifier>(
		[
			["c", "aa"], ["i", "inf"], ["a", "art"], ["t", "arm"],
			["f", "fig"], ["b", "bom"], ["S", "sub"], ["D", "des"],
			["C", "cru"], ["A", "acc"], ["B", "bat"], ["E", "bat"], 
			["d", "inf"], ["T", "tra"], ["e", "aa"], ["F", "dbat"],
			["g", "art_a"], ["j", "inf_a"], ["u", "arm_a"], ["p", "ic"]
		]);


export const  Unit2ExternalNameMap = new Map<string, string>(
		[
			["c", "AA"], ["i", "Inf"], ["a", "Art"], ["t", "Arm"],
			["f", "Fig"], ["b", "Bom"], ["S", "Sub"], ["D", "Des"],
			["C", "Cru"], ["A", "ACC"], ["B", "Bat"], /* ["E", "Bat"], intentional */
			["d", "Inf"], ["T", "Tra"], ["e", "AA"], ["F", "DBat"],
			["g", "Art*"], ["j", "Inf*"], ["u", "Arm*"], ["p", "IPC"]
		]);

export interface UnitGroup {
	units : Army,
	ool :   UnitIdentifier[]		// units as above
	takes : number,			// number of land unto take as attacker
	aaLast : boolean		// aa last as defender
}

export interface WaveInput {
	attack : 	UnitGroup,
	defense : 	UnitGroup,
	att_submerge : boolean,
	def_submerge : boolean,
	att_dest_last : boolean,
	def_dest_last : boolean,
	is_crash_fighters : boolean,
	rounds : number,		// -1 means all rounds
	retreat_threshold : number		// retreat if <= number of units remaining.
}

export interface MultiwaveInput {
	wave_info : WaveInput[];
	debug	: boolean;
	prune_threshold : number;
	report_prune_threshold : number;
	is_naval : boolean;
	in_progress : boolean;
	num_runs	: number;
	verbose_level : number;
	diceMode : DiceMode;
}

export interface SbrInput {
	attack : 	UnitGroup,
	defense : 	UnitGroup,
	verbose_level : number;
	diceMode : DiceMode;
	in_progress : boolean;
}

export type Side = "attack" | "defense"
export type CasualtiesInfo = Record<Side, Record<string, CasualtyInfo>>;

export interface CasualtyInfo {
  casualties: string
  survivors: string
  retreaters: string
  amount: number
  ipcLoss: number
}

export interface CalcInfo {
	survives : number[] 
	ipcLoss : number[]
}

export interface MultiwaveOutput {
	attack : CalcInfo;
	defense : CalcInfo;
	casualtiesInfo : CasualtiesInfo;
	takesTerritory : number[];
	rounds : number[];
	waves : number;
}

export function multiwaveExternal(
		input : MultiwaveInput
		) 
   : MultiwaveOutput
{
	let internal_input : multiwave_input;

	let wavearr : wave_input[] = [];
	for (let i = 0; i < input.wave_info.length; i++) { 
		let wave = input.wave_info[i];
		let [att_unitstr, att_oolstr] = make_unit_group_string(
			wave.attack.units, wave.attack.ool, wave.attack.takes, false, input.is_naval, input.verbose_level);
		let [def_unitstr, def_oolstr] = make_unit_group_string(
			wave.defense.units, wave.defense.ool, 0, wave.defense.aaLast, input.is_naval, input.verbose_level);
		
		let internal_wave = { attacker : att_unitstr, 
			  defender : def_unitstr,
			  def_ool : def_oolstr,
			  def_aalast : wave.defense.aaLast,
			  att_submerge : wave.att_submerge,
			  def_submerge : wave.def_submerge,
			  att_dest_last : wave.att_dest_last,
			  def_dest_last : wave.def_dest_last,
			  is_crash_fighters : wave.is_crash_fighters,
			  rounds : wave.rounds,
			  retreat_threshold : wave.retreat_threshold };
		
		wavearr.push(internal_wave);
	}

	internal_input = {
		verbose_level : input.verbose_level,
		wave_info : wavearr,
		debug	: input.debug,
		prune_threshold : input.prune_threshold,
		report_prune_threshold : input.report_prune_threshold,
		is_naval : input.is_naval,
		in_progress : input.in_progress,
		diceMode : input.diceMode,
		num_runs	: input.num_runs
		}

	let internal_output = multiwave(internal_input);
    let out : MultiwaveOutput;
	let rounds : number[] = [];
	for (let i = 0; i < internal_output.output.length; i++) {
		rounds.push(internal_output.output[i].rounds);
	}
	let casualtiesInfo : CasualtiesInfo = { attack : {}, defense : {}};
	let att : Record<string, CasualtyInfo> = {};
	let def : Record<string, CasualtyInfo> = {};
   
	let lastWave = internal_output.output.length - 1;
	let lastOutput = internal_output.output[lastWave];
	let um = new unit_manager(input.verbose_level);
	for (let i = 0; i < lastOutput.att_cas.length; i++) {
		let cas = lastOutput.att_cas[i];
		let casualty : CasualtyInfo;
		casualty = { casualties : get_external_unit_str(um, cas.casualty),	
					survivors :  get_external_unit_str(um, cas.remain),
					retreaters : get_external_unit_str(um, cas.retreat),
					amount : 	cas.prob,	
					ipcLoss :    get_cost_from_str(um, cas.casualty)
					}
		att[i] = casualty;	
	}
	for (let i = 0; i < lastOutput.def_cas.length; i++) {
		let cas = lastOutput.def_cas[i];
		let casualty : CasualtyInfo;
		casualty = { casualties : get_external_unit_str(um, cas.casualty),	
					survivors :  get_external_unit_str(um, cas.remain),
					retreaters : get_external_unit_str(um, cas.retreat),
					amount : 	cas.prob,	
					ipcLoss :    get_cost_from_str(um, cas.casualty)
					}
		def[i] = casualty;	
	}
	casualtiesInfo["attack"] = att;
	casualtiesInfo["defense"] = def;
	
	out = {
		attack : internal_output.out.attack,
		defense : internal_output.out.defense,
		waves : internal_output.output.length,		
		takesTerritory : internal_output.out.takesTerritory,
		rounds : rounds,
		casualtiesInfo : casualtiesInfo
	}
	
    return out;
}


export function make_unit_group_string(
		units : Army,
		ool : UnitIdentifier[],		// array of order of loss
		takes : number,		// number of land units to take with
		aa_last : boolean,		// take aa as second last casualty for defender
		is_naval : boolean,
		verbose_level : number
		) : [string, string]		// unit_str , ool_str
{

	let unitstr = "";
	let um = new unit_manager(verbose_level);

	for (const [uid , count ] of Object.entries(units)) {
        if (count == 0) {
            continue;
        }
        let ch = UnitIdentifier2UnitMap[<UnitIdentifier>uid];
        if (ch == undefined) {
            throw new Error("make unit group string failed");
        }
        for (let i = 0; i < count; i++) {
            unitstr += ch;
        }
	}
	
	let oolstr = "";
	for (let i  = ool.length-1 ; i >= 0; i--) {
		let unit = ool[i];
		let ch = UnitIdentifier2UnitMap[unit];
		if (ch == undefined) {
			throw new Error("make unit group string failed");
		}
		oolstr += ch;
	}
	if (!is_naval) {
		oolstr += "BC"
	}
	if (is_naval) {
		oolstr = "T" + oolstr;
	}
    let mymap : Map<string, number> = new Map();
	let ool2 = "";
	for (const ch of oolstr) {
		if (mymap.has(ch)) {
			continue;
		}	
		mymap.set(ch, 1);
		ool2 += ch;
	}
	oolstr = ool2;
	
    let out = apply_ool(unitstr, oolstr, aa_last);
	if (!is_naval && takes > 0) {
		// move takes land units to the front.
		let head = ""
		let remains = out;
		for (let i = 0; i < takes; i++) {
			let j;
			let found = false;
			let ch;
			for (j = 0; j < remains.length; j++) {
				ch = remains.charAt(j);
				let stat = um.get_stat(ch);
				if (stat == undefined) {
					throw new Error("make unit group string failed");
				}
				if (stat.isLand) {
					found = true;
					remains = remains.substr(0, j) + remains.substr(j+1)
					head += ch;
					break;
				}
			}
			out = head + remains;
			if (verbose_level > 0) {
				console.log(out);
			}
		}
	}
	return [out, oolstr];
}


export function get_external_unit_str(um : unit_manager, input : string) :
        string
{
    let map : Map<string, number> = new Map();

    for (var char of input) {
        let v = map.get(char);
        if (v != undefined) {
            map.set(char, v + 1);
        } else {
            map.set(char, 1);
        }
    }

    let out = ""
    map.forEach((value : number, key : string) => {
		let externalName = Unit2ExternalNameMap.get(key);
		if (externalName == undefined) {	
			return;
		}
        out = out + value + " " + externalName + ", "
    })
    return out.substring(0, out.length - 2);
}

export function sbrExternal (input : SbrInput) : MultiwaveOutput 
{
	let output : MultiwaveOutput;
	let internalInput : sbr_input = {
			diceMode : input.diceMode,
			verboseLevel : input.verbose_level,
			numBombers : input.attack.units["bom"] != undefined ? input.attack.units["bom"] : 0,
			industrialComplexHitPoints : input.defense.units["ic"] != undefined ?  input.defense.units["ic"] : 0,
			inProgress : input.in_progress
		};
	//console.log(internalInput);
	let internalOutput = sbr(internalInput);
	let casualtiesInfo : CasualtiesInfo = { attack : {}, defense : {}};
	let att : Record<string, CasualtyInfo> = {};
	let def : Record<string, CasualtyInfo> = {};
	let um = new unit_manager(input.verbose_level);
	for (let i = 0; i < internalOutput.att_cas.length; i++) {
		let cas = internalOutput.att_cas[i];
		let casualty : CasualtyInfo;
		casualty = { casualties : get_external_unit_str(um, cas.casualty),	
					survivors :  get_external_unit_str(um, cas.remain),
					retreaters : get_external_unit_str(um, cas.retreat),
					amount : 	cas.prob,	
					ipcLoss :    get_cost_from_str(um, cas.casualty)
					}
		att[i] = casualty;	
	}
	for (let i = 0; i < internalOutput.def_cas.length; i++) {
		let cas = internalOutput.def_cas[i];
		let casualty : CasualtyInfo;
		casualty = { casualties : get_external_unit_str(um, cas.casualty),	
					survivors :  get_external_unit_str(um, cas.remain),
					retreaters : get_external_unit_str(um, cas.retreat),
					amount : 	cas.prob,	
					ipcLoss :    get_cost_from_str(um, cas.casualty)
					}
		def[i] = casualty;	
	}
	casualtiesInfo["attack"] = att;
	casualtiesInfo["defense"] = def;
   
	output = {
		attack : internalOutput.attack,
		defense : internalOutput.defense,	
		casualtiesInfo : casualtiesInfo,
		takesTerritory : [],
		rounds : [1, 0, 0],
		waves : 1
	}
	
    return output;
}

export interface MultiwaveOutput {
    attack : CalcInfo;
    defense : CalcInfo;
    casualtiesInfo : CasualtiesInfo;
    takesTerritory : number[];
    rounds : number[];
    waves : number;
}
