

import {unit_manager, 
		apply_ool,
        multiwave_input, wave_input, multiwave,
		get_external_unit_str,	
		get_cost_from_str } from "./solve";

export type UnitIdentifier = "aa" | "inf" | "art" | "arm" | "fig" | "bom" | "sub" | "tra" | "des" | "cru" | "acc" | "bat" | "bat1" | "dbat" | "ic" | "inf_a" | "art_a" | "arm_a";

export type Army = Partial<Record<UnitIdentifier, number>>;

export const  UnitIdentifier2UnitMap : Record<UnitIdentifier, string> = {
		aa: "c", inf: "i", art: "a", arm: "t", fig: "f", bom: "b", sub : "S", tra: "T", des: "D", cru: "C", acc: "A", bat: "B", dbat: "B", 
		ic : "", inf_a: "i", art_a : "a", arm_a : "t", bat1: "B"}

export const  Unit2UnitIdentifierMap = new Map<string, UnitIdentifier>(
		[
			["c", "aa"], ["i", "inf"], ["a", "art"], ["t", "arm"],
			["f", "fig"], ["b", "bom"], ["S", "sub"], ["D", "des"],
			["C", "cru"], ["A", "acc"], ["B", "bat"], ["E", "bat"],
			["d", "inf"], ["T", "tra"], ["e", "aa"]
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
	retreat_threshold : number		// retreat if <= number of units remaining.
}

export interface MultiwaveInput {
	wave_info : WaveInput[];
	debug	: boolean;
	prune_threshold : number;
	report_prune_threshold : number;
	is_naval : boolean;
	num_runs	: number;
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
			wave.attack.units, wave.attack.ool, wave.attack.takes, false, input.is_naval);
		let [def_unitstr, def_oolstr] = make_unit_group_string(
			wave.defense.units, wave.defense.ool, 0, wave.defense.aaLast, input.is_naval);
		
		let internal_wave = { attacker : att_unitstr, 
			  defender : def_unitstr,
			  def_ool : def_oolstr,
			  att_submerge : wave.att_submerge,
			  def_submerge : wave.def_submerge,
			  att_dest_last : wave.att_dest_last,
			  def_dest_last : wave.def_dest_last,
			  retreat_threshold : wave.retreat_threshold };
		
		wavearr.push(internal_wave);
	}

	internal_input = {
		wave_info : wavearr,
		debug	: input.debug,
		prune_threshold : input.prune_threshold,
		report_prune_threshold : input.report_prune_threshold,
		is_naval : input.is_naval,
		num_runs	: input.num_runs
		}

	let internal_output = multiwave(internal_input);
    let out : MultiwaveOutput;
	let rounds : number[] = [];
	for (let i = 0; i < internal_output.output.length; i++) {
		rounds.push(-1);
	}
	let casualtiesInfo : CasualtiesInfo = { attack : {}, defense : {}};
	let att : Record<string, CasualtyInfo> = {};
	let def : Record<string, CasualtyInfo> = {};
   
	let lastWave = internal_output.output.length - 1;
	let lastOutput = internal_output.output[lastWave];
	let um = new unit_manager();
	for (let i = 0; i < lastOutput.att_cas.length; i++) {
		let cas = lastOutput.att_cas[i];
		let casualty : CasualtyInfo;
		casualty = { casualties : get_external_unit_str(um, cas.casualty),	
					survivors :  get_external_unit_str(um, cas.remain),
					retreaters : "",
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
					retreaters : "",
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
		is_naval : boolean
		) : [string, string]		// unit_str , ool_str
{

	let unitstr = "";
	let um = new unit_manager();

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
    let out = apply_ool(unitstr, oolstr);
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
			console.log(out);
		}
	}
	return [out, oolstr];
}



