import * as readline from 'readline';

import { Heap } from 'heap-js';

const stdin: any = process.stdin;

const epsilon : number = 1e-9;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});


let input = []
let debug = 0
let report_prune_threshold = -1;
let prune_threshold = -1;
let early_prune_threshold = -1;
let isnaval = 0;
let att_destroyer_last = 0;
let def_destroyer_last = 0;
let att_submerge = 0;
let def_submerge = 0;
let attackers = "";
let defenders = "";
let att_ool = "";
let def_ool2= "";
let def_ool3= "";
let attackers2 = "";
let defenders2 = "";
let attackers3 = "";
let defenders3 = "";
let strafe_threshold = -1;
let retreat_threshold1 = -1;
let retreat_threshold2 = -1;
let retreat_threshold3 = -1;
let i = 0;
let num_runs = 1;
let in_progress = false;

rl.on('line', (line) => {
	switch (i) {
		case 0: 
			debug = parseInt(line);
			break;
		case 1:
			report_prune_threshold = parseFloat(line);
			break;
		case 2:
			prune_threshold = parseFloat(line);
			early_prune_threshold = prune_threshold / 10;
			break;
		case 3:
			isnaval = parseInt(line);
			break;
		case 4:
			attackers = line;
			break;
		case 5:
			defenders = line;
			break;
		case 6:
			strafe_threshold = parseFloat(line);
			break;
        case 7:
			num_runs = Math.max(parseInt(line), 1);
			break;
		case 8: 
			att_destroyer_last = Math.max(parseInt(line), 0);
			break;
		case 9: 
			att_submerge = Math.max(parseInt(line), 0);
			break;
		case 10: 
			def_destroyer_last = Math.max(parseInt(line), 0);
			break;
		case 11: 
			def_submerge = Math.max(parseInt(line), 0);
			break;
		case 12: 
			attackers2 = line;
			break;
		case 13: 
			defenders2 = line;
			break;
		case 14: 
			def_ool2 = line;
			break;
		case 15: 
			attackers3 = line;
			break;
		case 16: 
			defenders3 = line;
			break;
		case 17: 
			def_ool3 = line;
			break;
		case 18: 
			in_progress = parseInt(line) > 0;
			break;
		case 19: 
			retreat_threshold1 = parseInt(line);
			break;
		case 20: 
			retreat_threshold2 = parseInt(line);
			break;
		case 21: 
			retreat_threshold3 = parseInt(line);
			break;
    }
	i++;
});

rl.once('close', () => {
	console.log("done");
	//run();
	//run2();
	run3();
     // end of input
 });

class unit_group_manager {
    unit_group_arr : unit_group[];
	mymap : Map<string, number>;
	get_or_create_unit_group(um : unit_manager, input : string, attdef : number) : unit_group {
		let ug;
		let ii = this.mymap.get(input+attdef);
		if (ii == undefined) {
			ug = new unit_group(um, input, attdef);
			if (ug == undefined) {
				console.log(input+attdef, "ug manager FATAL -- undefind");
				process.exit(1);
			}
			for (let i = 1; i <= input.length; i++) {
				let t = input.substring(0,i) + attdef;
				this.mymap.set(t, this.unit_group_arr.length);
			}
			this.unit_group_arr.push(ug);
		} else {
			ug = this.unit_group_arr[ii];
		}
		return ug;
	}
	constructor() {
		this.mymap = new Map();
		this.unit_group_arr = [];
	}
}

class unit_manager {
	unit_stats : Map<string, unit_stat> ;
	rev_map : Map<string, string>;
	unit_group_manager : unit_group_manager;
	constructor() {
		this.unit_stats = new Map();
		this.rev_map = new Map();
		this.init_units();
		this.unit_group_manager = new unit_group_manager();
	}
	init_units() {
		this.make_unit('e', 'c', 0, 0, 5, 1, true, false, false, false, true, false);
		this.make_unit('c', 'c', 0, 0, 5, 1, false, false, false, false, true, false);
		this.make_unit('i', 'i', 1, 2, 3, 1, true, false, false, false, false, false);
		this.make_unit('a', 'a', 2, 2, 4, 1, true, false, false, false, false, false);
		this.make_unit('d', 'i', 2, 2, 3, 1, false, false, false, false, false, false);
		this.make_unit('t', 't', 3, 3, 6, 1, true, false, false, false, false, false);
		this.make_unit('f', 'f', 3, 4, 10, 1, false, false, false, true, false, false);
		this.make_unit('b', 'b', 4, 1, 12, 1, false, false, false, true, false, false);
		this.make_unit('A', 'A', 1, 2, 14, 1, false, false, false, false, false, false);
		this.make_unit('C', 'C', 3, 3, 12, 1, false, false, false, false, false, true);
		this.make_unit('D', 'D', 2, 2, 8, 1, false, false, true, false, false, false);
		this.make_unit('S', 'S', 2, 1, 6, 1, false, true, false, false, false, false);
		this.make_unit('B', 'B', 4, 4, 20, 2, false, false, false, false, false, true);
		this.make_unit('E', 'E', 0, 0, 0, 2, false, false, false, false, false, false);
		this.make_unit('T', 'T', 0, 0, 7, 1, false, false, false, false, false, false);
	}
	make_unit(ch : string, ch2 : string, att : number, def : number, cost : number, hits : number, isLand : boolean, isSub : boolean, 
			isDestroyer : boolean, isAir : boolean, isAA : boolean, isBombard : boolean) {
		let unit = new unit_stat(ch, ch2, att, def, cost, hits, isLand, isSub, isDestroyer, isAir, isAA, isBombard);
		this.unit_stats.set(ch, unit);
		this.rev_map.set(ch2, ch);
	}
	get_stat(ch : string) : unit_stat {
		let v = this.unit_stats.get(ch);
		if (v == undefined) {
			console.log(ch, "get stat FATAL -- undefind");
			throw new Error("get stat failed");
		}
		return v;
	}
}


class unit_group {
	unit_str : string;
 	attdef	: number
	size	: number
	tbl_size : number
    prob_table : number[][]
    max_prob_table : number[]
    prob_hits : number[]
	first_destroyer_index : number
	power	: number[]
	pless	: number[][]
	pgreater	: number[][]
	prob_table2 : number[]
	getIndex(i : number, j : number) : number {
		return i * this.tbl_size + j;
	}
	geti_prob_table(ii : number) : number {
		return this.prob_table2[ii];
	}
	get_prob_table(i : number, j : number) : number {
		let ii = this.getIndex(i, j);
		return this.prob_table2[ii];
	}
	seti_prob_table(ii : number, val : number) {
		this.prob_table2[ii] = val;
	}
	set_prob_table(i : number, j : number, val : number) {
		let ii = this.getIndex(i, j);
		this.prob_table2[ii] = val;
	}
	constructor(manager : unit_manager, input_str : string, attdef : number) {
		this.unit_str = input_str;
		this.size = input_str.length;
		this.tbl_size = this.size + 1;
		this.max_prob_table = []
		this.prob_table = []
		this.prob_table2 = []
		this.pless = []
		this.pgreater = []
		this.power = []
		this.attdef = attdef;
		this.prob_hits = []
		this.first_destroyer_index = -1;
		let i : number;
		let j : number;
		console.log(input_str, "make_unit_group");
		for (i = 0; i < this.tbl_size; i++) {
			this.prob_table[i] = []
			this.pless[i] = []
			this.pgreater[i] = []
			for (j = 0; j < this.tbl_size; j++) {
				this.prob_table[i][j] = 0;
				this.pless[i][j] = 0;
				this.pgreater[i][j] = 0;
				this.set_prob_table(i, j, 0);
			}
		}
		for (i = 0; i < this.size; i++) {
			let ii = i + 1;
			let ch = this.unit_str.charAt(i);
			//console.log(i, ch);
			let stat = manager.get_stat(ch);
			//console.log(stat);
			let val;
			switch(attdef) {
				case 0:
					val = stat.att;
					break;
				case 1:
					val = stat.def;
					break;
				case 2:
				default:	
					val = 1;
			}
			this.prob_hits[ii] = val / 6;
			if (i == 0) {
				this.power[ii] = val;
			} else {
				this.power[ii] = this.power[ii-1] + val;
			}
		}
		this.compute_prob_table();

		// i units get j hits or less/
		for (i = 0; i < this.tbl_size; i++) {
			for (j = 0; j <= i; j++) {
				if (j == 0) {
					this.pless[i][j] = this.prob_table[i][j];
				} else {
					this.pless[i][j] = this.pless[i][j-1] + this.prob_table[i][j];
				}
			}
		}
		// i units get j hits or greater/
		for (i = 0; i < this.tbl_size; i++) {
			for (j = i; j >= 0; j--) {
				if (j == i) {
					this.pgreater[i][j] = this.prob_table[i][j];
				} else {
					this.pgreater[i][j] = this.pgreater[i][j+1] + this.prob_table[i][j];
				}

			}
		}
	}
	compute_prob_table() {
		let P = this.prob_table;
		let ph = this.prob_hits;
		let tbl_sz = this.tbl_size;
		let i, j;
		P[0][0] = 1.0;
		this.set_prob_table(0, 0, 1.0);
		for (j =1; j < tbl_sz; j++) {
			P[0][j] = 0.0;
			this.set_prob_table(0, j, 0.0);
		}
		for (i = 1; i < tbl_sz; i++) {
			P[i][0] = (1-ph[i]) * P[i-1][0];
			this.set_prob_table(i, 0, (1-ph[i]) * this.get_prob_table(i-1,0));
			for (j =1; j < tbl_sz; j++) {
				if (j > i) {
					P[i][j] = 0.0;
					this.set_prob_table(i, j, 0.0);
				} else {
					P[i][j] = ph[i] * P[i-1][j-1] +
					(1-ph[i]) * P[i-1][j];
					this.set_prob_table(i, j, ph[i] * this.get_prob_table(i-1, j-1) + 
												(1-ph[i]) * this.get_prob_table(i-1, j));
				}
			}
		}
		for (i = 0; i < tbl_sz; i++) {
			let maxp = -1;
			for (j =0; j <= i; j++) {
				maxp = Math.max(maxp, P[i][j]);
			}
			this.max_prob_table[i] = maxp;
		}
		//console.log(this);
	}
}

class naval_unit_graph_node {
	unit_str : string;
	N		: number;
	num_subs : number;
	num_air : number;
	num_naval : number;
	num_dest : number;
	num_submerge : number;
	cost : number;
	dlast : boolean = false;
	index : number = 0;
    next_aahit : naval_unit_graph_node | undefined = undefined;
    next_subhit : naval_unit_graph_node | undefined = undefined;
    next_airhit : naval_unit_graph_node | undefined = undefined;
    next_navalhit : naval_unit_graph_node | undefined = undefined;
    next_dlast_subhit : naval_unit_graph_node | undefined = undefined;
    next_dlast_airhit : naval_unit_graph_node | undefined = undefined;
    next_dlast_navalhit : naval_unit_graph_node | undefined = undefined;    next_submerge : naval_unit_graph_node | undefined = undefined;
	naaArr : number[] = [];
	nsubArr : number[] = [];
	nairArr : number[] = [];
	nnavalArr : number[] = [];
	ndlastsubArr : number[] = [];
	ndlastairArr : number[] = [];
	ndlastnavalArr : number[] = [];
	nosub_group : unit_group | undefined= undefined;
	numBB : number = 0;
	constructor( um : unit_manager, unit_str : string, num_submerge : number) {
		this.unit_str = unit_str;
		this.N = unit_str.length;
		this.num_subs = count_units(unit_str, 'S');
		this.num_air = count_units(unit_str, 'f') + count_units(unit_str, 'b');
		this.num_naval = this.N - this.num_subs - this.num_air;
		this.numBB = count_units(this.unit_str, 'E');
		this.num_dest = count_units(this.unit_str, 'D');
		this.num_submerge = num_submerge;
		this.cost = get_cost_from_str(um, unit_str, num_submerge);
	}
}

class naval_unit_group {
	um : unit_manager;
	unit_str : string = "";
	attdef : number = 0;
	destroyer_last : boolean = false;
	submerge_sub : boolean = false;
	num_subs : number = 0;
	num_naval : number = 0;
	num_air : number = 0;
	num_aashot : number = 0;
	sub_group : unit_group;
	naval_group : unit_group;
	air_group : unit_group;
	dlast_group : unit_group | undefined;

	nodeArr : naval_unit_graph_node[] = [];

	constructor (um : unit_manager, input_str : string, attdef : number, dest_last : boolean, submerge : boolean, 
						max_remove_hits : number, numAA : number = 0,
						cas : casualty_1d[] | undefined = undefined) {
		this.um = um;
		this.unit_str = input_str;
		this.attdef = attdef;
		this.destroyer_last = dest_last;
		this.submerge_sub = submerge;
		this.num_subs = count_units(input_str, 'S');
		this.num_air = count_units(input_str, 'f') + count_units(input_str, 'b');
		this.num_naval = input_str.length - this.num_subs - this.num_air;
		let subs = ""
		for (let i = 0; i < this.num_subs; i++) {
			subs += 'S';
		}
		this.sub_group = make_unit_group(um, subs, attdef);

		let planes = "";
		for (let i = 0; i < input_str.length; i++) {
			let ch = input_str.charAt(i);
			//console.log(ch, `ch`);
			if (isAir(this.um, ch)) {
				planes += ch;
			}
		}
		this.air_group = make_unit_group(um, planes, attdef);


		let naval = "";
		let first_destroyer_index = -1;
		for (let i = 0; i < input_str.length; i++) {
			let ch = input_str.charAt(i);
			if (!isAir(this.um, ch) && !isSub(this.um, ch)) {
				if (isDestroyer(um, ch)) {
					if (first_destroyer_index < 0) {
						first_destroyer_index = naval.length;
					}
				}
				naval += ch;
			}
		}
		console.log(naval, "naval_unit_group_construct");


		this.naval_group = make_unit_group(um, naval, attdef);
		this.naval_group.first_destroyer_index = first_destroyer_index;

		if (first_destroyer_index >= 0) {
			let destlast = "D" + naval.substr(0, first_destroyer_index) + naval.substr(first_destroyer_index+1);
			this.dlast_group = make_unit_group(um, destlast, attdef);
		} else {
			this.dlast_group = this.naval_group;
		}

		//console.log(first_destroyer_index, "first_destroyer_index");
		compute_remove_hits(this, max_remove_hits, numAA, cas );
		//console.log("remove hits done");
	}
}

class naval_problem {
	um : unit_manager;
	is_naval : boolean;
	prob : number = 0;
	att_data : naval_unit_group;
	def_data : naval_unit_group;
	P_1d : number[] = [];
	def_cas : casualty_1d[] | undefined = undefined
	prune_threshold : number = -1;
	early_prune_threshold : number = -1;
	report_prune_threshold : number = -1;
	retreat_threshold : number = 0;
	strafe_threshold : number = -1;
	strafe_num_threshold : number = 0;
	strafe_do_num_check : boolean = false;
	strafe_do_attpower_check : boolean = false;
	strafe_attpower_threshold : number = 0;
	getIndex(i : number, j : number) : number {
		return i * this.def_data.nodeArr.length + j;
	}
	getiP(ii : number) : number {
		return this.P_1d[ii];
	}
	getP(i : number, j : number) : number {
		let ii = this.getIndex(i, j);
		return this.P_1d[ii];
	}
	setiP(ii : number, val : number) {
		this.P_1d[ii] = val;
	}
	setP(i : number, j : number, val : number) {
		let ii = this.getIndex(i, j);
		this.P_1d[ii] = val;
	}
	set_prune_threshold( pt : number, ept : number, rpt : number) {
		this.prune_threshold = pt;
		this.early_prune_threshold = ept;
		this.report_prune_threshold = rpt;
	}
    constructor(um : unit_manager, att_str : string, def_str : string, prob : number,
			att_dest_last : boolean, att_submerge : boolean , def_dest_last : boolean , def_submerge : boolean,
			is_naval : boolean = true,
			def_cas	: casualty_1d[] | undefined = undefined
			 ) {
		
		this.um = um;

		let numAA = count_units(def_str, 'c');
		
		let max_att_hits = att_str.length;
		let max_def_hits = def_str.length;
		if (!is_naval) {
			let numBombard = 
					count_units(att_str, 'B') + 
					count_units(att_str, 'C');
			max_def_hits += numBombard;
		}

		this.att_data = new naval_unit_group(um, att_str, 0, att_dest_last, att_submerge, max_def_hits+ 2, numAA);
		//console.log(this.att_data, `att`);
		this.def_data = new naval_unit_group(um, def_str, 1, def_dest_last, def_submerge, max_att_hits+ 2, 0, def_cas);
		//console.log(this.def_data, `def`);
		this.prob = prob;
		this.def_cas = def_cas;
		this.is_naval = is_naval;
		//console.log(this, `make_problem`);
	}
}



class problem {
	um : unit_manager;
	prob : number;
	cas : string = "";
	att_data : unit_group;
	def_data : unit_group;
	P2 : number[] = [];
	prune_threshold : number = -1;
	report_prune_threshold : number = -1;
	early_prune_threshold : number = -1;
	retreat_threshold : number = 0;
	strafe_threshold : number = -1;
	strafe_num_threshold : number = 0;
	strafe_do_num_threshold : boolean = false;
	strafe_do_attpower_check : boolean = false;
	strafe_attpower_threshold : number = 0;
	getIndex(i : number, j : number) : number {
		return i * this.def_data.tbl_size + j;
	}
	getiP(ii : number) : number {
		return this.P2[ii];
	}
	getP(i : number, j : number) : number {
		let ii = this.getIndex(i, j);
		return this.P2[ii];
	}
	setiP(ii : number, val : number) {
		this.P2[ii] = val;
	}
	setP(i : number, j : number, val : number) {
		let ii = this.getIndex(i, j);
		this.P2[ii] = val;
	}
	set_prune_threshold( pt : number, ept : number, rpt : number) {
		this.prune_threshold = pt;
		this.early_prune_threshold = ept;
		this.report_prune_threshold = rpt;
	}

	constructor(um : unit_manager, att_str : string, def_str : string, prob : number, cas : string = "") {
		this.um = um;
		this.att_data = new unit_group(um, att_str, 0);
		//console.log(p.att_data, `att`);
		this.def_data = new unit_group(um, def_str, 1);
		//console.log(p.def_data, `def`);
		this.prob = prob;
		this.cas = cas;
		//console.log(p, `make_problem`);
	}
}

class result_data_t {
	problem_index : number;
	i : number;
	j : number;
	cost : number;
	p : number;
	cumm : number = 0;
	rcumm : number = 0;

	constructor(
		index : number, 	
		i: number, 
		j: number, 
		cost: number, 
		p : number) {
		this.problem_index = index;
		this.i = i;
		this.j = j;
		this.p = p;
		this.cost = cost;
	}
}

class unit_stat {
	ch : string;
	ch2 : string;
	att : number;
	def : number;
	cost : number;
	hits : number;
	isLand : boolean;
	isSub : boolean;
	isDestroyer : boolean;
	isAir : boolean;
	isAA : boolean;
	isBombard : boolean;
	constructor(ch : string, ch2 : string, att : number, def : number, cost : number, hits : number, 
			isLand : boolean, isSub : boolean, isDestroyer : boolean, isAir : boolean, isAA : boolean, isBombard : boolean) {
		this.ch = ch;
		this.ch2 = ch2;
		this.att = att;
		this.def = def;
		this.cost = cost;
		this.hits = hits;
		this.isSub = isSub;
		this.isDestroyer = isDestroyer;
		this.isAir = isAir;
		this.isAA = isAA;
		this.isBombard = isBombard;
		this.isLand = isLand;
	}
}


function hasDestroyer( group : naval_unit_group, node : naval_unit_graph_node) : boolean {
	if (node.dlast) {
		return node.num_naval > 0;
	}
	if (group.naval_group.first_destroyer_index >= 0) {
		return  (node.num_naval > group.naval_group.first_destroyer_index);
	}
	return false;
}


function remove_subhits( group : naval_unit_group, hits : number, index : number) : number 
{
    let node = group.nodeArr[index];
/*
	if (node.N == 0) {
		return index;
	}
	//let n = Math.min(hits, node.nsubArr.length-1);
*/
	let n = hits;
	return node.nsubArr[n];	
}
function remove_aahits( group : naval_unit_group, hits : number, index : number) : number 
{
    let node = group.nodeArr[index];
/*
	if (node.N == 0) {
		return index;
	}
	//let n = Math.min(hits, node.naaArr.length-1);
*/
	let n = hits;
	return node.naaArr[n];	
}

function remove_dlast_subhits( group : naval_unit_group, hits : number, index : number) : number 
{
    let node = group.nodeArr[index];
/*
	if (node.N == 0) {
		return index;
	}
	//let n = Math.min(hits, node.ndlastsubArr.length-1);
*/
	let n = hits;
	return node.ndlastsubArr[n];	
}


function remove_planehits( group : naval_unit_group, destroyer : boolean, hits : number, index : number) : number 
{
    let node = group.nodeArr[index];
/*
	if (node.N == 0) {
		return index;
	}
*/
	if (!destroyer) {
		//let n = Math.min(hits, node.nairArr.length-1);
		let n = hits;
		return node.nairArr[n];	
	} else {
		//let n = Math.min(hits, node.nnavalArr.length-1);
		let n = hits;
		return node.nnavalArr[n];	
	}
}

function remove_dlast_planehits( group : naval_unit_group, destroyer : boolean, hits : number, index : number) : number 
{
    let node = group.nodeArr[index];
/*
	if (node.N == 0) {
		return index;
	}
*/
	if (!destroyer) {
		//let n = Math.min(hits, node.ndlastairArr.length-1);
		let n = hits;
		return node.ndlastairArr[n];	
	} else {
		//let n = Math.min(hits, node.ndlastnavalArr.length-1);
		let n = hits;
		return node.ndlastnavalArr[n];	
	}
}


function remove_navalhits( group : naval_unit_group, hits : number, index : number) : number 
{
    let node = group.nodeArr[index];
/*
	if (node.N == 0) {
		return index;
	}
*/
	//let n = Math.min(hits, node.nnavalArr.length-1);
	let n = hits;
	return node.nnavalArr[n];	
}

function remove_dlast_navalhits( group : naval_unit_group, hits : number, index : number) : number 
{
    let node = group.nodeArr[index];
/*
	if (node.N == 0) {
		return index;
	}
*/
	//let n = Math.min(hits, node.ndlastnavalArr.length-1);
	let n = hits;
	return node.ndlastnavalArr[n];	
}



function solve_one_naval_state(problem : naval_problem, N : number, M : number, allow_same_state : boolean, numBombard : number)
{
    let attnode = problem.att_data.nodeArr[N];
    let defnode = problem.def_data.nodeArr[M];

    if (attnode.N == 0 || defnode.N == 0) {
        return;
    }

	//console.log(N, M, "solve_one_naval");
    let p_init = problem.getP(N, M);

	if (p_init == 0) {
	    return;
	}
	if (problem.retreat_threshold > 0) {
		if (attnode.N <= problem.retreat_threshold) {
			return;
		}
	}

    if (p_init < problem.prune_threshold) {
		problem.setP(N, M, 0);
        return;
    }

    let N1 = attnode.num_subs;
    let N2 = attnode.num_air;
    let N3 = attnode.num_naval;
    let M1 = defnode.num_subs;
    let M2 = defnode.num_air;
    let M3 = defnode.num_naval;

	let att_destroyer = hasDestroyer(problem.att_data, attnode);
	let def_destroyer = hasDestroyer(problem.def_data, defnode);
	let att_dlast = (problem.att_data.destroyer_last && M1 > 0);
	let def_dlast = (problem.def_data.destroyer_last && N1 > 0);

	let att_submerge = (problem.att_data.submerge_sub && N1 > 0 &&
						!def_destroyer);
	let def_submerge = (problem.def_data.submerge_sub && M1 > 0 &&
						!att_destroyer);

	if (att_submerge || def_submerge) {
		let n = attnode.index;
		let m = defnode.index;
		if (att_submerge) {
			if (attnode.next_submerge == undefined) {
				throw new Error();
			}
			n = attnode.next_submerge.index;
		}
		if (def_submerge) {
			if (defnode.next_submerge == undefined) {
				throw new Error();
			}
			m = defnode.next_submerge.index;
		}
		let ii = problem.getIndex(n, m);
		problem.setiP(ii, problem.getiP(ii) + p_init);
		problem.setP(N, M, 0);
		return;
	} 

    let Pa_sub = problem.att_data.sub_group.prob_table;
    let Pa_air = problem.att_data.air_group.prob_table;
    let Pa_naval = problem.att_data.naval_group.prob_table;
    let Pd_sub = problem.def_data.sub_group.prob_table;
    let Pd_air = problem.def_data.air_group.prob_table;
    let Pd_naval = problem.def_data.naval_group.prob_table;
    let att_sub = problem.att_data.sub_group;
    let att_air = problem.att_data.air_group;
    let att_naval = problem.att_data.naval_group;
	if (attnode.dlast && problem.att_data.dlast_group != undefined) {
		att_naval = problem.att_data.dlast_group;
	}
    let def_sub = problem.def_data.sub_group;
    let def_air = problem.def_data.air_group;
    let def_naval = problem.def_data.naval_group;
	if (defnode.dlast && problem.def_data.dlast_group != undefined) {
		def_naval = problem.def_data.dlast_group;
	}

    let NN = problem.att_data.nodeArr.length;
    let MM = problem.def_data.nodeArr.length;
    let i, j;

	// prob no hits.
    let P0 =
            att_sub.get_prob_table(N1, 0) *
            att_air.get_prob_table(N2, 0) *
            att_naval.get_prob_table(N3, 0) *
            def_sub.get_prob_table(M1, 0) *
            def_air.get_prob_table(M2, 0) *
            def_naval.get_prob_table(M3, 0);

    // subs vs. planes.
	if ((N1 > 0 && N2 == 0 && N3 == 0) && (M1 == 0 && M2 > 0 && M3 == 0)) {
        return;
	}
	if ((M1 > 0 && M2 == 0 && M3 == 0) && (N1 == 0 && N2 > 0 && N3 == 0)) {
        return;
	}
	// attacker all subs
	if (N1 > 0 && N2 == 0 && N3 == 0 && M2 > 0) {
		if (!def_destroyer) {
			// def no destroyer && def plane_hits > 0 && sub hits == 0 && naval hits == 0
			//let p = Pa_sub[N1][0] * Pd_sub[M1][0] * Pd_naval[M3][0] * (1 - Pd_air[M2][0]);	// > 0 plane hits... that don't apply.
			let p = att_sub.get_prob_table(N1, 0) * def_sub.get_prob_table(M1, 0) * def_naval.get_prob_table(M3,0) *
						(1 - def_air.get_prob_table(M2, 0));	// > 0 plane hits... that don't apply.
			P0 += p;
		}
	}
    // defender all subs
	if (M1 > 0 && M2 == 0 && M3 == 0 && N2 > 0) {
		if (!att_destroyer) {
			//let p = Pd_sub[M1][0] * Pa_sub[N1][0] * Pa_naval[N3][0] * (1 - Pa_air[N2][0]);	// > 0 plane hits... that don't apply.
			let p = def_sub.get_prob_table(M1, 0) * att_sub.get_prob_table(N1, 0) * att_naval.get_prob_table(N3, 0) * 
						(1 - att_air.get_prob_table(N2, 0));    // > 0 plane hits... that don't apply.
			P0 += p;
		}
	}
		
	// attacker all planes.
	if (N1 == 0 && N2 > 0 && N3 == 0 && M1 > 0) {
		//let p = Pa_air[N2][0] * Pd_naval[M3][0] * Pd_air[M2][0] * (1 - Pd_sub[M1][0]);
		let p = att_air.get_prob_table(N2, 0) * def_naval.get_prob_table(M3, 0) * def_air.get_prob_table(M2, 0) * 
					(1 - def_sub.get_prob_table(M1, 0));
		P0 += p;
	}
	// defender all planes.
	if (M1 == 0 && M2 > 0 && M3 == 0 && N1 > 0) {
		//let p = Pd_air[M2][0] * Pa_naval[N3][0] * Pa_air[N2][0] * (1 - Pa_sub[N1][0]);
		let p = def_air.get_prob_table(M2, 0) * att_naval.get_prob_table(N3, 0) * att_air.get_prob_table(N2, 0) * 
					(1 - att_sub.get_prob_table(N1, 0));
		P0 += p;
	}

    let r = p_init/(1-P0);
	if (allow_same_state) {
		r = p_init;
	}
	
    let prob : number;
    let p2, p3, p4, p5 : number;
    let new_i, new_j : number;

    /*
     *  N1 ==> sub hits
     *  N2 ==> plane hits
     *  N3 ==> naval hits
     */

    let i1, i2, i3;
    let j1, j2, j3;
    let newM1, newM2, newM3;
    let newN1, newN2, newN3;
    let hasSubs = (N1 > 0 || M1 > 0);
    //hasSubs = true;

	let def_remove_subhits_function;
	let def_remove_planehits_function;
	let def_remove_navalhits_function;
	if (def_dlast) {
		def_remove_subhits_function = remove_dlast_subhits;
		def_remove_planehits_function = remove_dlast_planehits;
		def_remove_navalhits_function = remove_dlast_navalhits;
	} else {
		def_remove_subhits_function = remove_subhits;
		def_remove_planehits_function = remove_planehits;
		def_remove_navalhits_function = remove_navalhits;
	}
	let att_remove_subhits_function;
	let att_remove_planehits_function;
	let att_remove_navalhits_function;
	if (att_dlast) {
		att_remove_subhits_function = remove_dlast_subhits;
		att_remove_planehits_function = remove_dlast_planehits;
		att_remove_navalhits_function = remove_dlast_navalhits;
	} else {
		att_remove_subhits_function = remove_subhits;
		att_remove_planehits_function = remove_planehits;
		att_remove_navalhits_function = remove_navalhits;
	}
	problem.setP(N, M, 0);

    if (!hasSubs && attnode.nosub_group != undefined && defnode.nosub_group != undefined ) {
        let Pa_nosub = attnode.nosub_group.prob_table;
        let Pd_nosub = defnode.nosub_group.prob_table;
        let att_nosub = attnode.nosub_group;
        let def_nosub = defnode.nosub_group;
        let i, j;
        let NNN = N2 + N3;
        let MMM = M2 + M3;
		let m, n;
		let P0 = att_nosub.get_prob_table(NNN, 0) * def_nosub.get_prob_table(MMM, 0);
		let r = p_init * 1/(1-P0);
		if (allow_same_state) {
			r = p_init;
		}
        for (i = 0; i <= NNN; i++) {
			let m = remove_navalhits(problem.def_data, i, M);
			let p1 = att_nosub.get_prob_table(NNN, i) * r;
            for (j = 0; j <= MMM; j++) {
                prob = p1 * def_nosub.get_prob_table(MMM, j);
				let n = remove_navalhits(problem.att_data, j + numBombard, N);
				let ii = problem.getIndex(n, m);
				problem.setiP(ii, problem.getiP(ii) + prob);
            }
        }
    } else {        /*  i att hits, j def hits */
		if (true && (N1 * M1 > 2)) {
			let m = remove_subhits(problem.def_data, N1, M);
			let n = remove_subhits(problem.att_data, M1, N);
			let defnode2 = problem.def_data.nodeArr[m];
			let attnode2 = problem.att_data.nodeArr[n];
			newM1 = M1;
			newM2 = M2;
			newM3 = M3;
			newN1 = N1;
			newN2 = N2;
			newN3 = N3;
            if (!def_destroyer)  {
                newM1 = defnode2.num_subs;
                newM2 = defnode2.num_air;
                newM3 = defnode2.num_naval;
            }
			if (!att_destroyer) {
				newN1 = attnode2.num_subs;
				newN2 = attnode2.num_air;
				newN3 = attnode2.num_naval;
			}
			let maxV1 = att_air.max_prob_table[newN2];
			let maxV2 = def_air.max_prob_table[newM2];
			let maxV3 = att_naval.max_prob_table[newN3];
			let maxV4 = def_naval.max_prob_table[newM3];
			let maxV5 = att_sub.max_prob_table[newN1];
			let maxV6 = def_sub.max_prob_table[newM1];
			let maxp = r * (maxV1 * maxV2 * maxV3 * maxV4 * maxV5 * maxV6);
			if (maxp < problem.early_prune_threshold) {
				problem.setP(N, M, 0);
				return;
			}
		}
        for (i1 = 0; i1 <= N1; i1++) {
            newN1 = N1;
            newN2 = N2;
            newN3 = N3;
            newM1 = M1;
            newM2 = M2;
            newM3 = M3;
			let m = def_remove_subhits_function(problem.def_data, i1, M);
			let defnode2 = problem.def_data.nodeArr[m];
            if (!def_destroyer)  {
				if (defnode2 == undefined) {
					console.log(i1, M, m, problem.def_data.nodeArr[M], problem.def_data.nodeArr[M].nsubArr,  "undefined remove sub");
				}
                newM1 = defnode2.num_subs;
                newM2 = defnode2.num_air;
                newM3 = defnode2.num_naval;
            }
            for (j1 = 0; j1 <= M1; j1++) {
				let n = att_remove_subhits_function(problem.att_data, j1, N);
				let attnode2 = problem.att_data.nodeArr[n];
                if (!att_destroyer) {
                    newN1 = attnode2.num_subs;
                    newN2 = attnode2.num_air;
                    newN3 = attnode2.num_naval;
                }
                if (att_destroyer && !def_destroyer) {
                    prob = att_sub.get_prob_table(N1, i1) * def_sub.get_prob_table(newM1, j1) * r;
                } else if (!att_destroyer && def_destroyer) {
                    prob = att_sub.get_prob_table(newN1, i1) * def_sub.get_prob_table(M1, j1) * r;
                } else {
                    prob = att_sub.get_prob_table(N1, i1) * def_sub.get_prob_table(M1, j1) * r;
                }
				let maxV1 = att_air.max_prob_table[newN2];
				let maxV2 = def_air.max_prob_table[newM2];
				let maxV3 = att_naval.max_prob_table[newN3];
				let maxV4 = def_naval.max_prob_table[newM3];
				let ept0 = problem.early_prune_threshold / (maxV1 * maxV2 * maxV3 * maxV4);
				let ept1 = ept0 * maxV1;
				let ept2 = ept1 * maxV2;
				let ept3 = ept2 * maxV3;
				let ept4 = problem.early_prune_threshold;
                if (prob < ept0) {
                    continue;
                }
                for (i2 = 0; i2 <= newN2; i2++) {
                    p2 = prob * att_air.get_prob_table(newN2, i2);
                    if (p2 < ept1) {
                        continue;
                    }
					let m2 = def_remove_planehits_function(problem.def_data, att_destroyer, i2, m);
                    for (j2 = 0; j2 <= newM2; j2++) {
                        p3 = p2 * def_air.get_prob_table(newM2, j2);
                        if (p3 < ept2) {
                            continue;
                        }
						let n2 = att_remove_planehits_function(problem.att_data, def_destroyer, j2, n);
                        for (i3 = 0; i3 <= newN3; i3++) {
                            p4 = p3 * att_naval.get_prob_table(newN3, i3);
                            if (p4 < ept3) {
                                continue;
                            }
							let m3 = def_remove_navalhits_function(problem.def_data, i3, m2);
                            for (j3 = 0; j3 <= newM3; j3++) {
                                p5 = p4 * def_naval.get_prob_table(newM3, j3);
                                if (p5 < ept4) {
                                    continue;
                                }
								let n3 = att_remove_navalhits_function(problem.att_data, j3, n2);
								let ii = problem.getIndex(n3, m3);
								problem.setiP(ii, problem.getiP(ii) + p5);
                            }
						}
                    }
                }
            }
        }
		
    }
    if (!allow_same_state) {
		problem.setP(N, M, 0);
    }
}


function solve_one_state(problem : problem, N : number, M : number, allow_same_state : boolean, numBombard : number)
{
	if (N == 0 || M == 0) {
		return;
 	}

	//let P = problem.P;

	//let p_init = P[N][M];
	let p_init = problem.getP(N, M);

	if (p_init == 0) {
	    return;
	}
    if (p_init < problem.prune_threshold) {
		problem.setP(N, M, 0);
        //P[N][M] = 0;
		return;
    }
	if (problem.retreat_threshold > 0) {
		if (N <= problem.retreat_threshold) {
			return;
		}
	}

	let Pa = problem.att_data.prob_table;
	let Pd = problem.def_data.prob_table;
	let att_data = problem.att_data;
	let def_data = problem.def_data;

	//let P0 = Pa[N][0] * Pd[M][0];
	let P0 = att_data.get_prob_table(N, 0) * def_data.get_prob_table(M, 0);
	let r = 1/(1-P0);
	if (allow_same_state) {
		r = 1.0;
	}
	r = r * p_init;
    let prob;
    let i,j;
    let new_i, new_j;
    //P[N][M] = 0;
	problem.setP(N, M, 0);
    /*  i att hits, j def hits */
    for (i = 0; i <= N;i++) {
        for (j = 0; j <= M; j++) {
            //prob = Pa[N][i] * Pd[M][j] * r * p_init;
			prob = att_data.get_prob_table(N, i) * def_data.get_prob_table(M, j) * r;
            new_i = N-j - numBombard;
            new_j = M-i;
            if (new_i < 0) new_i = 0;
            if (new_j < 0) new_j = 0;
            //P[new_i][new_j] += prob;
			let ii = problem.getIndex(new_i, new_j);
            problem.setiP(ii, problem.getiP(ii) + prob);
        }
    }
    if (!allow_same_state) {
        //P[N][M] = 0;
		problem.setP(N, M, 0);
    /*  i att hits, j def hits */
    }
}

function isAir(um : unit_manager, input : string) : boolean {
	let stat = um.get_stat(input);
	return stat.isAir;
}
function isSub(um : unit_manager, input : string) : boolean {
	let stat = um.get_stat(input);
	return stat.isSub;
}
function isDestroyer(um : unit_manager, input : string) : boolean {
	let stat = um.get_stat(input);
	return stat.isDestroyer;
}
function isLand(um : unit_manager, input : string) : boolean {
	let stat = um.get_stat(input);
	return stat.isLand;
}

function hasLand(um : unit_manager, input : string) : boolean {
	for (let i = input.length-1; i >= 0; i--) {
		let ch = input.charAt(i);
		if (isLand(um, ch)) {
			return true;
		}
	}
	return false;
}

function remove_one_plane(um : unit_manager, input_str : string) : [string, string]
{
	let N = input_str.length;
	let found = false;
	for (let i = N-1; i >= 0; i--) {
		let ch = input_str.charAt(i);
		if (isAir(um, ch)) {
			let out = input_str.substring(0, i) + 
						input_str.substring(i+1, N);
			return [out, ch];
		}
	}
	return [input_str, ""];
}
function remove_one_notdestroyer(um : unit_manager, input_str : string) : string 
{
	let N = input_str.length;
	let found = false;
	for (let i = N-1; i >= 0; i--) {
		let ch = input_str.charAt(i);
		if (!isDestroyer(um, ch)) {
			let out = input_str.substring(0, i) + 
						input_str.substring(i+1, N);
			return out;
		}
	}
	for (let i = N-1; i >= 0; i--) {
		let ch = input_str.charAt(i);
		if (true) {
			let out = input_str.substring(0, i) + 
						input_str.substring(i+1, N);
			return out;
		}
	}
	return input_str;
}
function remove_one_notplane(um : unit_manager, input_str : string, skipd : boolean) : string 
{
	let N = input_str.length;
	let found = false;
	for (let i = N-1; i >= 0; i--) {
		let ch = input_str.charAt(i);
		if (!isAir(um, ch) && (!skipd || !isDestroyer(um, ch))) {
			let out = input_str.substring(0, i) + 
						input_str.substring(i+1, N);
			return out;
		}
	}
	if (skipd) {
		for (let i = N-1; i >= 0; i--) {
			let ch = input_str.charAt(i);
			if (!isAir(um, ch)) {
				let out = input_str.substring(0, i) + 
							input_str.substring(i+1, N);
				return out;
			}
		}
	}

	return input_str;
}
function remove_one_notsub(um : unit_manager, input_str : string, skipd : boolean) : string 
{
	let N = input_str.length;
	let found = false;
	for (let i = N-1; i >= 0; i--) {
		let ch = input_str.charAt(i);
		if (!isSub(um, ch) && (!skipd || !isDestroyer(um, ch))) {
			let out = input_str.substring(0, i) + 
						input_str.substring(i+1, N);
			return out;
		}
	}
	if (skipd) {
		for (let i = N-1; i >= 0; i--) {
			let ch = input_str.charAt(i);
			if (!isSub(um, ch)) {
				let out = input_str.substring(0, i) + 
							input_str.substring(i+1, N);
				return out;
			}
		}
	}

	return input_str;
}
function retreat_subs(um : unit_manager, input_str : string) : [string, number]
{
	let N = input_str.length;
	let out = ""
	let num_subs = 0;
	for (let i = 0; i < N; i++) {
		let ch = input_str.charAt(i);
		if (!isSub(um, ch)) {
			out = out + ch;
		} else {
			num_subs++;
		}
	}
	return [out, num_subs];
}

function report_filter (p : number) : number {
    if (p < report_prune_threshold) {
		return 0;
	}
	return p;
}

function get_cost_from_str(um : unit_manager, s : string, num_submerge : number = 0) : number
{
    let cost = 0;
    let i;
    let j = 0;
    for (i = 0; i < s.length; i++) {
        let ch = s.charAt(i);
		let stat = um.get_stat(ch);
        cost += stat.cost;
    }
	cost += (num_submerge * um.get_stat("S").cost);
    return cost;
}

function get_cost_remain(um : unit_manager, group : unit_group, ii : number ) : number
{
    let N = group.tbl_size;
    let cost = 0;
    let i;
    let j = 0;
    for (i = 0; i < ii; i++) {
        let ch = group.unit_str[i];
		let stat = um.get_stat(ch);
        cost += stat.cost;
    }
    return cost;
}

function get_naval_cost_remain(um : unit_manager, group : naval_unit_group, ii : number, dbg : boolean = false) : number
{
    let node = group.nodeArr[ii];
	let cost = 0;
	if (node.num_submerge > 0) {
		let stat = um.get_stat("S");
		cost += stat.cost * node.num_submerge;
		//console.log(ii, node, cost, "cost remain");
	}
	if (node.dlast && group.dlast_group != undefined) {
		return 	cost + get_cost_remain(um, group.sub_group, node.num_subs) + 
			get_cost_remain(um, group.air_group, node.num_air) + 
			get_cost_remain(um, group.dlast_group, node.num_naval);
	} else {
		return 	cost + get_cost_remain(um, group.sub_group, node.num_subs) + 
			get_cost_remain(um, group.air_group, node.num_air) + 
			get_cost_remain(um, group.naval_group, node.num_naval);
	}
}

function collect_results(
	parent_prob : problem, 
	problemArr : problem[], 
	index : number,
	resultArr : result_data_t[]) : result_data_t[]
{
	let problem = problemArr[index];
    let N = problem.att_data.tbl_size;
    let M = problem.def_data.tbl_size;
    let NN = parent_prob.att_data.tbl_size;
    let MM = parent_prob.def_data.tbl_size;
    let i, j;
    let att : string;
    let def : string;
    let att_casualty : string;
    let def_casualty : string;
    let red_att : string;
    let red_def : string;
    let red_att_cas : string;
    let red_def_cas : string;
    let sum= 0.0;
    let sumatt= 0.0;
    let sumdef= 0.0;
    let sumatt0= 0.0;
    let sumdef0= 0.0;
                                    
    let att_loss, def_loss;
    let att_cost, def_cost;
    let count=0;

    let NN_base = get_cost_remain(parent_prob.um, parent_prob.att_data, NN-1);
    let MM_base = get_cost_remain(parent_prob.um, parent_prob.def_data, MM-1);
	let max_cost = NN_base + MM_base;
    for (i = 0; i < N;i++) {
        for (j = 0; j < M; j++) {
            //let p = report_filter(P[i][j]);
            let p = report_filter(problem.getP(i, j));
            if (p > 0) {
                att_cost = get_cost_remain(problem.um, problem.att_data, i);
                def_cost = get_cost_remain(problem.um, problem.def_data, j);
                let cost = (j - i) + ((def_cost - att_cost)/max_cost);
/*
                if (do_strafe) {
                    int attcas = NN - i;
                    int defcas = MM - j;
                    int attcascost = NN_base - att_cost;
                    int defcascost = MM_base - def_cost;
                    cost = (double) (attcas - defcas) +
                        ((double)(attcascost - defcascost)/max_cost);
                    if ( j == 0) {
                        cost += max_cost;
                    }
                }
*/
				let data = new result_data_t(index, i, j, cost, p);
				resultArr.push(data);
            }
		}
	}
	return resultArr;
}

function collect_naval_results(
	parent_prob : naval_problem, 
	problemArr : naval_problem[], 
	index : number,
	resultArr : result_data_t[]) : result_data_t[]
{
	let problem = problemArr[index];
    let N = problem.att_data.nodeArr.length;
    let M = problem.def_data.nodeArr.length;
    let NN = parent_prob.att_data.nodeArr.length;
    let MM = parent_prob.def_data.nodeArr.length;
    let i, j;
    let att : string;
    let def : string;
    let att_casualty : string;
    let def_casualty : string;
    let red_att : string;
    let red_def : string;
    let red_att_cas : string;
    let red_def_cas : string;
    let sum= 0.0;
    let sumatt= 0.0;
    let sumdef= 0.0;
    let sumatt0= 0.0;
    let sumdef0= 0.0;
                                    
    let att_loss, def_loss;
    let att_cost, def_cost;
    let count=0;

    let NN_base = get_naval_cost_remain(parent_prob.um, parent_prob.att_data, 0);
    let MM_base = get_naval_cost_remain(parent_prob.um, parent_prob.def_data, 0, true);
	let max_cost = NN_base + MM_base;
    for (i = 0; i < N;i++) {
        for (j = 0; j < M; j++) {
            //let p = report_filter(P[i][j]);
            let p = report_filter(problem.getP(i, j));
            if (p > 0) {
                att_cost = get_naval_cost_remain(problem.um, problem.att_data, i);
                def_cost = get_naval_cost_remain(problem.um, problem.def_data, j);
				let i2 = problem.att_data.nodeArr[i].N -  problem.att_data.nodeArr[i].numBB;
				let j2 = problem.def_data.nodeArr[j].N -  problem.def_data.nodeArr[j].numBB;
                let cost = (j2 - i2) + ((def_cost - att_cost)/max_cost);
/*
                if (do_strafe) {
                    int attcas = NN - i;
                    int defcas = MM - j;
                    int attcascost = NN_base - att_cost;
                    int defcascost = MM_base - def_cost;
                    cost = (double) (attcas - defcas) +
                        ((double)(attcascost - defcascost)/max_cost);
                    if ( j == 0) {
                        cost += max_cost;
                    }
                }
*/
				let data = new result_data_t(index, i, j, cost, p);
				resultArr.push(data);
            }
		}
	}
	return resultArr;
}

function merge_results(sortedArr : result_data_t[]) : result_data_t[]
{
	let mergedArr = sortedArr;
	let i, j;
    for (i =0; i < sortedArr.length; i++) {
        let result = sortedArr[i];
        j = i+1;
        if (j < sortedArr.length) {
			let result2 = sortedArr[j];
            if (Math.abs(result.cost - result2.cost) < epsilon) {
                result2.p += result.p;
                result.p = 0;
            }
        }
    }
	return mergedArr;
}
				

function get_group_string(um : unit_manager, group : unit_group, sz : number) : 
		string
{
	let out = ""
	for (let i = 0; i < sz; i++) {
		let ch = group.unit_str.charAt(i);
		let stat = um.get_stat(ch);
		out += stat.ch2;
	}
	return out;
}

function get_naval_group_string(um : unit_manager, group : naval_unit_group, sz : number) : 
		string
{
	let out = "";
	let node = group.nodeArr[sz];
	if (node.num_submerge > 0) {
		for (let i = 0; i < node.num_submerge; i++) {
			out += "S";
		}
	}
	let out1 = ""
	for (const ch of node.unit_str) {
		if (ch == "") {
			continue;
		}
		let stat = um.get_stat(ch);
		out1 += stat.ch2;
	}
	return out1 + out;
}

function get_reduced_group_string(input : string) :
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
		out = out + value + key + ", "
	})
	return out.substring(0, out.length - 2);
}




function get_cost(um: unit_manager, group : unit_group, ii : number, cas : string = "", skipBombard : boolean = false) : 
	[number, string]
{
    let N = group.tbl_size;
    let cost = 0;
    let i;
    let out : string = "";
    let j = 0;
    for (i = ii; i < N; i++) {
        let ch = group.unit_str.charAt(i);
		if (ch == "") {
			continue;
		}
		if (skipBombard) {
			if ((ch == "B") || (ch == "C")) {
				continue;
			}
		}

		let stat = um.get_stat(ch);
        cost += stat.cost;
        out = out + stat.ch2;
    }
	for (const ch of cas) {
		if (ch == "") {
			continue;
		}
		let stat = um.get_stat(ch);
        cost += stat.cost;
        out = out + stat.ch2;
	}	
    return [cost, out];
}
function get_naval_cost(problem : naval_problem, group : naval_unit_group, ii : number) : 
	[number, string]
{
	let skipBombard = false;
	if (!problem.is_naval && group.attdef == 0) {
		skipBombard = true;
	}
    let node = group.nodeArr[ii];
	let c1, c2, c3 : number;
	let subcas, aircas, navalcas : string;
	[c1, subcas] = get_cost(problem.um, group.sub_group, node.num_subs);
	[c2, aircas] = get_cost(problem.um, group.air_group, node.num_air);
	if (node.num_submerge > 0) {
		let stat = problem.um.get_stat("S");
		c1 -= stat.cost * node.num_submerge;
		subcas = subcas.substring(node.num_submerge);
	}
	if (!node.dlast || group.dlast_group == undefined) {
		[c3, navalcas] = get_cost(problem.um, group.naval_group, node.num_naval, "", skipBombard);
	} else {
		[c3, navalcas] = get_cost(problem.um, group.dlast_group, node.num_naval, "", skipBombard);
	} 
	return [c1+c2+c3, subcas+aircas+navalcas];
}

function print_results(
		baseproblem : problem,
		problemArr : problem[],
		resultArr : result_data_t[])  : aacalc_output
{
	console.log(resultArr.length, `number of results`);

	let sortedArr = resultArr.sort((n1, n2) => {
			let r1 = n1.cost;
			let r2 = n2.cost;
			if (Math.abs(r1 - r2) < epsilon) {
				return 0;
			} else if (r1 < r2) {
				return -1;
			} else {
				return 1;
			}
		});
	
    let mergedArr = merge_results(sortedArr);

	let N = baseproblem.att_data.tbl_size;
	let M = baseproblem.def_data.tbl_size;
    let att : string;
    let def : string;
    let red_att : string;
    let red_def : string;
    let att_casualty : string;
    let def_casualty : string;
    let red_att_cas : string;
    let red_def_cas : string;

    att = get_group_string(baseproblem.um, baseproblem.att_data, N-1);
    def = get_group_string(baseproblem.um, baseproblem.def_data, M-1);
	red_att = get_reduced_group_string(att);
	red_def = get_reduced_group_string(def);
	console.log(`attackers = ${att}`);
	console.log(`defenders = ${def}`);
	console.log(`attackers = ${red_att}`);
	console.log(`defenders = ${red_def}`);

    let sum = 0.0;

    let attsurvive = 0;
    let defsurvive = 0;
    for (let ii = 0; ii < mergedArr.length; ii++) {
        let result = mergedArr[ii];
        let p = result.p;
        sum +=  p;
        result.cumm = sum;
		if (get_cost_remain(baseproblem.um, problemArr[result.problem_index].att_data, 
				result.i) > 0) {
			attsurvive += p;
		}
		if (get_cost_remain(baseproblem.um, problemArr[result.problem_index].def_data, 
				result.j) > 0) {
			defsurvive += p;
		}
    }
    sum = 0.0;
    for (let ii = mergedArr.length-1; ii >= 0; ii--) {
        let result = mergedArr[ii];
        let p = result.p;
        sum +=  p;
        result.rcumm = sum;
    }


	let casualties : casualty_2d[];
	casualties = [];

    let totalattloss = 0;
    let totaldefloss = 0;
	let takes = 0;

	// accumulate attacker and defender maps.
	let att_map : Map<string, number> = new Map();
	let def_map : Map<string, number> = new Map();
	let att_cas_map : Map<string, string> = new Map();
	let def_cas_map : Map<string, string> = new Map();

 
    for (let ii = 0; ii < mergedArr.length; ii++) {
        let result = mergedArr[ii];
        let problem = problemArr[result.problem_index];
		//let P = problem.P;
        att = get_group_string(problem.um, problem.att_data, result.i);
        def = get_group_string(problem.um, problem.def_data, result.j);
        red_att = get_reduced_group_string(att);
        red_def = get_reduced_group_string(def);
        let  [att_loss, att_casualty] = get_cost(problem.um, problem.att_data, result.i, problem.cas, true)
        let  [def_loss, def_casualty] = get_cost(problem.um, problem.def_data, result.j)
        red_att_cas = get_reduced_group_string(att_casualty);
        red_def_cas = get_reduced_group_string(def_casualty);
        let p = report_filter(result.p);
		let d_p = def_map.get(def);
		if (d_p == undefined) {
			def_map.set(def, p);
		} else {
			def_map.set(def, d_p + p);
		}
		let a_p = att_map.get(att);
		if (a_p == undefined) {
			att_map.set(att, p);
		} else {
			att_map.set(att, a_p + p);
		}
		att_cas_map.set(att, att_casualty);
		def_cas_map.set(def, def_casualty);
        if (p > 0) {
			if (hasLand(problem.um, att)) {
				takes += p;
			}
			totalattloss += (att_loss * p);
			totaldefloss += (def_loss * p);
			let cas : casualty_2d = { attacker : red_att, defender : red_def, attacker_casualty : red_att_cas, defender_casualty : red_def_cas, prob : p}
			casualties.push( cas );
			console.log(`result:  P[%d][%d] ${red_att} vs. ${red_def} (loss ${red_att_cas} ${att_loss} vs. ${red_def_cas} ${def_loss})= ${p} cumm(${result.cumm}) rcumm(${result.rcumm}) (${result.cost})`, result.i, result.j);
        }
    }
	console.log(`attsurvive: ${attsurvive}`);
	console.log(`defsurvive: ${defsurvive}`);


	let att_cas_1d : casualty_1d[];
	att_cas_1d = [];
	let def_cas_1d : casualty_1d[];
	def_cas_1d = [];

	for (let [att, p] of att_map) {
		let att_cas = att_cas_map.get(att);
		if (att_cas != undefined) {
			let cas : casualty_1d = { remain : att, casualty : att_cas, prob : p}
			att_cas_1d.push(cas);
		} else {
			console.log("FATAL -- undefind");
			throw new Error();
		}
	}

	for (let [def, p] of def_map) {
		let def_cas = def_cas_map.get(def);
		if (def_cas != undefined) {
			let cas : casualty_1d = { remain : def, casualty : def_cas, prob : p}
			def_cas_1d.push(cas);
		} else {
			console.log("FATAL -- undefind");
			throw new Error();
		}
	}
	
	
	//console.log(casualties);
    let output : aacalc_output = {
				attack : { survives : [attsurvive, 0, 0], ipcLoss : [totalattloss, 0, 0]},
				defense : { survives : [defsurvive, 0, 0], ipcLoss : [totaldefloss, 0, 0]},
				casualtiesInfo : casualties,	
				att_cas : att_cas_1d,	
				def_cas : def_cas_1d,	
				takesTerritory : [takes, 0, 0]
			};

	return output;
}


function print_naval_results(
		baseproblem : naval_problem,
		problemArr : naval_problem[],
		resultArr : result_data_t[]) : aacalc_output
{
	console.log(resultArr.length, `number of results`);

	let sortedArr = resultArr.sort((n1, n2) => {
			let r1 = n1.cost;
			let r2 = n2.cost;
			if (Math.abs(r1 - r2) < epsilon) {
				return 0;
			} else if (r1 < r2) {
				return -1;
			} else {
				return 1;
			}
		});
	
    let mergedArr = merge_results(sortedArr);
    //let mergedArr = sortedArr;

	let N = baseproblem.att_data.nodeArr.length;
	let M = baseproblem.def_data.nodeArr.length;
    let att : string;
    let def : string;
    let red_att : string;
    let red_def : string;
    let att_casualty : string;
    let def_casualty : string;
    let red_att_cas : string;
    let red_def_cas : string;

    att = get_naval_group_string(baseproblem.um, baseproblem.att_data, 0);
    def = get_naval_group_string(baseproblem.um, baseproblem.def_data, 0);
	red_att = get_reduced_group_string(att);
	red_def = get_reduced_group_string(def);
	console.log(`attackers = ${att}`);
	console.log(`defenders = ${def}`);
	console.log(`attackers = ${red_att}`);
	console.log(`defenders = ${red_def}`);

    let sum = 0.0;

    let attsurvive = 0;
    let defsurvive = 0;
    for (let ii = 0; ii < mergedArr.length; ii++) {
        let result = mergedArr[ii];
        let p = result.p;
        sum +=  p;
        result.cumm = sum;
		if (get_naval_cost_remain(baseproblem.um, problemArr[result.problem_index].att_data, 
				result.i) > 0) {
			attsurvive += p;
		}
		if (get_naval_cost_remain(baseproblem.um, problemArr[result.problem_index].def_data, 
				result.j) > 0) {
			defsurvive += p;
		}
    }
    sum = 0.0;
    for (let ii = mergedArr.length-1; ii >= 0; ii--) {
        let result = mergedArr[ii];
        let p = result.p;
        sum +=  p;
        result.rcumm = sum;
    }

 
	let casualties : casualty_2d[];
	casualties = [];

	// accumulate attacker and defender maps.
	let att_map : Map<number, number> = new Map();
	let def_map : Map<number, number> = new Map();

    let totalattloss = 0;
    let totaldefloss = 0;
	let takes = 0;
    for (let ii = 0; ii < mergedArr.length; ii++) {
        let result = mergedArr[ii];
        let problem = problemArr[result.problem_index];
        att = get_naval_group_string(problem.um, problem.att_data, result.i);
        def = get_naval_group_string(problem.um, problem.def_data, result.j);
        red_att = get_reduced_group_string(att);
        red_def = get_reduced_group_string(def);
        let  [att_loss, att_casualty] = get_naval_cost(problem, problem.att_data, result.i)
        let  [def_loss, def_casualty] = get_naval_cost(problem, problem.def_data, result.j)
        red_att_cas = get_reduced_group_string(att_casualty);
        red_def_cas = get_reduced_group_string(def_casualty);
        let p = report_filter(result.p);
		let d_p = def_map.get(result.j);
		if (d_p == undefined) {
			def_map.set(result.j, p);
		} else {
			def_map.set(result.j, d_p + p);
		}
		let a_p = att_map.get(result.i);
		if (a_p == undefined) {
			att_map.set(result.i, p);
		} else {
			att_map.set(result.i, a_p + p);
		}
        if (p > 0) {
			totalattloss += (att_loss * p);
			totaldefloss += (def_loss * p);
			if (hasLand(problem.um, att)) {
				takes += p;
			}
			//console.log(`result:  P[%d][%d] ${red_att} vs. ${red_def} = ${p} cumm(${result.cumm}) rcumm(${result.rcumm}) (${result.cost})`, result.i, result.j);
			console.log(`result:  P[%d][%d] ${red_att} vs. ${red_def} (loss ${red_att_cas} ${att_loss} vs. ${red_def_cas} ${def_loss})= ${p} cumm(${result.cumm}) rcumm(${result.rcumm}) (${result.cost})`, result.i, result.j);
			let cas : casualty_2d = { attacker : red_att, defender : red_def, attacker_casualty : red_att_cas, defender_casualty : red_def_cas, prob : p}
			casualties.push( cas );
        }
    }
	console.log(`attsurvive: ${attsurvive}`);
	console.log(`defsurvive: ${defsurvive}`);

	let att_cas_1d : casualty_1d[];
	att_cas_1d = [];
	let def_cas_1d : casualty_1d[];
	def_cas_1d = [];

	for (let [i, p] of att_map) {
        let att = get_naval_group_string(baseproblem.um, baseproblem.att_data, i);
        let  [att_loss, att_cas] = get_naval_cost(baseproblem, baseproblem.att_data, i)
		let cas : casualty_1d = { remain : att, casualty : att_cas, prob : p}
		att_cas_1d.push(cas);
	}

	for (let [j, p] of def_map) {
        let def = get_naval_group_string(baseproblem.um, baseproblem.def_data, j);
        let  [def_loss, def_cas] = get_naval_cost(baseproblem, baseproblem.def_data, j)
		let cas : casualty_1d = { remain : def, casualty : def_cas, prob : p}
		def_cas_1d.push(cas);
	}
	
	//console.log(casualties);
    let output : aacalc_output = {
				attack : { survives : [attsurvive, 0, 0], ipcLoss : [totalattloss, 0, 0]},
				defense : { survives : [defsurvive, 0, 0], ipcLoss : [totaldefloss, 0, 0]},
				casualtiesInfo : casualties,	
				att_cas : att_cas_1d,	
				def_cas : def_cas_1d,	
				takesTerritory : [takes, 0, 0]
			};

	return output;
}




function solveAA(myprob : problem, numAA : number)  : aacalc_output
{
    let num_shots = (numAA * 3);
    let num_planes = count_units(myprob.att_data.unit_str, 'f') + count_units(myprob.att_data.unit_str, 'b');
    if (num_planes < num_shots)  num_shots = num_planes;

	console.log(num_shots, `solveAA numshots`);
	
	let aashots = ""

    for (let i =0; i < num_shots; i++) {
    	aashots = aashots + 'c';
    }
	let aa_data = make_unit_group(myprob.um, aashots, 2);

	let P = aa_data.prob_table;
    let N = aa_data.tbl_size;


	let att_str = myprob.att_data.unit_str;
	let att_cas = "";
	let problemArr : problem[];
	problemArr = [];

    for (let i = 0; i < N; i++) {
		console.log(i, `solveAA i`);
		let prob = P[N-1][i];
		if ( i > 0) {
			let cas;
			[att_str, cas] = remove_one_plane(myprob.um, att_str);
			att_cas += cas;
		}
		console.log(att_str, att_cas, `solveAA att_str att_cas`);
		problemArr[i] = new problem(myprob.um, att_str, myprob.def_data.unit_str, prob, att_cas);
		problemArr[i].set_prune_threshold(myprob.prune_threshold, myprob.early_prune_threshold, myprob.report_prune_threshold);
		solve(problemArr[i], 1 );
    }
	let result_data : result_data_t[];
	result_data = [];
	
    for (let i = 0; i < N; i++) {
        collect_results(myprob, problemArr, i, result_data);
    }
	let output = print_results(myprob, problemArr, result_data);
	return output;
}

function solve_sub(problem : naval_problem, skipAA : number)
{
    //debugger;
	problem.P_1d = [];
	let N = problem.att_data.nodeArr.length;
	let M = problem.def_data.nodeArr.length;
	let i, j;
    for (i = 0; i < N; i++) {
		for (j = 0; j < M; j++) {
			problem.setP(i, j, 0.0);
        }
	}

	if (problem.def_cas == undefined) {
		/* initial seed */
		problem.setP(0, 0, problem.prob);
		if (problem.att_data.num_aashot > 0) {
			let aashots = ""
			for (let i =0; i < problem.att_data.num_aashot; i++) {
				aashots = aashots + 'c';
			}
			let aa_data = make_unit_group(problem.um, aashots, 2);

			let P = aa_data.prob_table;
			let N = aa_data.tbl_size;
			for (let i = 0; i < N; i++) {
				let prob = P[N-1][i];
				let n = remove_aahits( problem.att_data, i, 0);
				problem.setP(n, 0, problem.prob * prob);
				console.log(i, n, problem.prob * prob, "i, n, prob -- solveAA");
			}
		}
	} else {
		let mymap : Map<string, number> = new Map();
		for (let i = 0; i < M; i++) {
			mymap.set(problem.def_data.nodeArr[i].unit_str, i);
		}
		let aa_data;
		let P;
		let N;
		if (problem.att_data.num_aashot > 0) {
			let aashots = ""
			for (let i =0; i < problem.att_data.num_aashot; i++) {
				aashots = aashots + 'c';
			}
			aa_data = make_unit_group(problem.um, aashots, 2);
			P = aa_data.prob_table;
			N = aa_data.tbl_size;
		}
		for (let i = 0; i < problem.def_cas.length; i++) {
			let ii = mymap.get(problem.def_cas[i].remain);
			if (ii == undefined) {
				throw new Error();
			} else {
				problem.setP(0, ii, problem.def_cas[i].prob);
				let p = problem.def_cas[i].prob;
				let numAA = count_units(problem.def_cas[i].remain, "c");

				if (numAA > 0 && problem.att_data.num_aashot > 0 && N != undefined && P != undefined) {
					let NN = Math.min(numAA * 3 + 1, N);
					
					for (let i = 0; i < NN; i++) {
						let prob = P[NN-1][i];
						let n = remove_aahits( problem.att_data, i, 0);
						problem.setP(n, ii, p * prob);
						console.log(i, n, problem.prob * prob, "i, n, prob -- solveAA");
					}
				}
			}
		}	
	}

/*
    for (i = 0; i < N ; i++) {
        for (j = 0; j < M ; j++) {
			console.log(i, j, problem.getP(i, j), "i, j, p");
		}
	}
*/
	// naval bombard
	
	if (!problem.is_naval) {
		let numBombard = 
				count_units(problem.att_data.unit_str, 'B') + 
				count_units(problem.att_data.unit_str, 'C');
		
		if (numBombard > 0)  {
			for (i = N-1; i >= 0 ; i--) {
				for (j = M-1; j >= 0 ; j--) {
					solve_one_naval_state(problem, i, j, true, numBombard);
				}
			}
		}
	}


    for (i = 0; i < N ; i++) {
        for (j = 0; j < M ; j++) {
            solve_one_naval_state(problem, i, j, false, 0);
        }
    }
}



function solve(problem : problem, skipAA : number) 
{
	problem.P2 = [];
	let N = problem.att_data.tbl_size;
	let M = problem.def_data.tbl_size;
	let i, j;
    for (i = 0; i < N; i++) {
		for (j = 0; j < M; j++) {
			problem.setP(i, j, 0.0);
        }
	}
    let numAA = count_units(problem.def_data.unit_str, 'c');
	if (skipAA || numAA == 0) {
		//problem.P[N-1][M-1] = problem.prob;
		problem.setP(N-1, M-1, problem.prob);
		let numBombard = 
				count_units(problem.att_data.unit_str, 'B') + 
				count_units(problem.att_data.unit_str, 'C');

		if (numBombard > 0) {
			solve_one_state(problem, N-1, M-1, true, numBombard);
		}
		for (i = N-1; i > 0; i--) {
			for (j = M-1; j > 0; j--) {
				solve_one_state(problem, i, j, false, 0);
			}
		}
	}
	
/*
	console.log(problem, `done solve`);
	console.log(problem.P[0][1], `P[0][1]`);
	console.log(problem.P[0][0], `P[0][0]`);
	console.log(problem.P[1][0], `P[1][0]`);
*/
}



function compute_remove_hits(naval_group : naval_unit_group, max_remove_hits : number, numAA : number, cas : casualty_1d[] | undefined = undefined)
{
    // compute next state graph
    // start with initial state.
    // from each node --  next states are:
    //   remove 1sub hit
    //   remove 1air hit  (no destroyer)
    //   remove 1naval hit (unconstrained)


    // root node
    let s = naval_group.unit_str;
    //printf ("%s", s);
    let node = new naval_unit_graph_node(naval_group.um, s, 0);
	node.dlast = false;

	let nodeVec : naval_unit_graph_node[];
	nodeVec = [];
	let mymap : Map<string, naval_unit_graph_node> = new Map();
	let q : number[];
	q = [];
	// information to uniquely identify a node
	const mycompare = (a : naval_unit_graph_node , b : naval_unit_graph_node) => b.cost - a.cost;
	let myheap = new Heap(mycompare);
    mymap.set(s+ 0, node);
	myheap.push(node);

	if (numAA > 0 && naval_group.attdef == 0) {
		let num_shots = (numAA * 3);
		let num_planes = naval_group.num_air;
		if (num_planes < num_shots)  num_shots = num_planes;
		console.log(num_shots, "num_shots");
		
		naval_group.num_aashot = num_shots;

		let att_str = s;
		let att_cas = "";
		let prev = node;
		let nnode = node;
		for (let i = 0; i <= num_shots; i++) {
			if ( i > 0) {
				let cas;
				[att_str, cas] = remove_one_plane(naval_group.um, att_str);
				att_cas += cas;
				nnode = new naval_unit_graph_node(naval_group.um, att_str, 0);
				myheap.push(nnode);
				mymap.set(att_str+ 0, nnode);
				prev.next_aahit = nnode;
			}
			prev = nnode;
		}
		prev.next_aahit = prev;
	}

	if (cas != undefined) {
		for (let i = 0; i < cas.length; i++) {
			let s = cas[i].remain;
			let key = s + 0;
			let ii = mymap.get(key);
			if (ii == undefined) {
				let newnode = new naval_unit_graph_node(naval_group.um, s, 0);
				if (newnode.num_naval > 0) {
					newnode.dlast = node.dlast;
				} else {
					newnode.dlast = false;
				}
				mymap.set(key, newnode);
				myheap.push(newnode);
				//console.log (newnode.index, "push 0");
			} else {
			}
		}
	}


    while (myheap.length > 0) {
        let node = myheap.pop();
		if (node == undefined) {
			throw new Error();
		}
		node.index = nodeVec.length;
		nodeVec.push(node);

		//console.log (node.index, node, nodeVec.length, "pop");
        if (node.N == 0) {
            node.next_navalhit = node;
            node.next_airhit = node;
            node.next_subhit = node;
            node.next_dlast_navalhit = node;
            node.next_dlast_airhit = node;
            node.next_dlast_subhit = node;
			node.next_submerge = node;
            continue;
        }
        let ch = node.unit_str[node.N-1];

        // unconstrained next:  remove last unit
		let s = node.unit_str.substring(0, node.unit_str.length - 1);

		let newnode : naval_unit_graph_node;
		
		let key = s + node.num_submerge;
		let ii = mymap.get(key);
        if (ii == undefined) {
			newnode = new naval_unit_graph_node(naval_group.um, s, node.num_submerge);
			if (newnode.num_naval > 0) {
				newnode.dlast = node.dlast;
			} else {
				newnode.dlast = false;
			}
			mymap.set(key, newnode);
            myheap.push(newnode);
			//console.log (newnode.index, "push 0");
        } else {
            newnode = ii;
        }
        node.next_navalhit = newnode;

        if (!isAir(naval_group.um, ch)) {
            // sub is the same as unconstrained/
            node.next_subhit = newnode;
        } else {
			let s2 = remove_one_notplane(naval_group.um, node.unit_str, false);
            let node2 : naval_unit_graph_node;
			let ii = mymap.get(s2+node.num_submerge);
			if (ii == undefined) {
				node2 = new naval_unit_graph_node(naval_group.um, s2, node.num_submerge);
				if (node2.num_naval > 0) {
					node2.dlast = node.dlast;
				} else {
					node2.dlast = false;
				}
				mymap.set(s2+node.num_submerge, node2);
				myheap.push(node2);
				//console.log (node2.index, "push 1");
			} else {
				node2 = ii;
			}
            node.next_subhit = node2;
        }
        if (!isSub(naval_group.um, ch)) {
            node.next_airhit = newnode;
        } else {
            let s2 = remove_one_notsub(naval_group.um, node.unit_str, false);
            let node2 : naval_unit_graph_node;
			let ii = mymap.get(s2+node.num_submerge);
			if (ii == undefined) {
				node2 = new naval_unit_graph_node(naval_group.um, s2, node.num_submerge);
				if (node2.num_naval > 0) {
					node2.dlast = node.dlast;
				} else {
					node2.dlast = false;
				}
				mymap.set(s2+node.num_submerge, node2);
				myheap.push(node2);
				//console.log (node2.index, "push 2");
			} else {
				node2 = ii;
			}
            node.next_airhit = node2;
        }
		node.next_dlast_navalhit = node.next_navalhit;
		node.next_dlast_airhit = node.next_airhit;
		node.next_dlast_subhit = node.next_subhit;
		let nnnode = node.next_navalhit;
		let nanode = node.next_airhit;
		let nsnode = node.next_subhit;
/*
		console.log (
				naval_group.destroyer_last, 
				node.num_dest,
				 node.num_naval,
				nnnode.num_dest,
				nanode.num_dest,
				nsnode.num_dest);
*/
		if (naval_group.destroyer_last && 
				node.num_dest == 1 &&
				nnnode.num_dest == 0) {
			//console.log ("here");
			// next naval
			let s2 = remove_one_notdestroyer(naval_group.um, node.unit_str);
			let node2 : naval_unit_graph_node;
			let ii = mymap.get(s2+node.num_submerge);
			if (ii == undefined) {
				node2 = new naval_unit_graph_node(naval_group.um, s2, node.num_submerge);
				node2.dlast = true;
				mymap.set(s2+node.num_submerge, node2);
				myheap.push(node2);
				//console.log (node2, "push 3");
				//console.log (node2.index, "push 3");
			} else {
				node2 = ii;
			}
			node.next_dlast_navalhit = node2;
		}
		if (naval_group.destroyer_last && 
				node.num_dest == 1 &&
				nanode.num_dest == 0) {
			// next air
			let s2 = remove_one_notsub(naval_group.um, node.unit_str, true);
			let node2 : naval_unit_graph_node;
			let ii = mymap.get(s2+node.num_submerge);
			if (ii == undefined) {
				node2 = new naval_unit_graph_node(naval_group.um, s2, node.num_submerge);
				node2.dlast = true;
				mymap.set(s2+ node.num_submerge, node2);
				myheap.push(node2);
				//console.log (node2, "push 4");
				//console.log (node2.index, "push 4");
			} else {
				node2 = ii;
			}
			node.next_dlast_airhit = node2;
		}
		if (naval_group.destroyer_last && 
				node.num_dest == 1 &&
				nsnode.num_dest == 0) {
			// next sub
			let s2 = remove_one_notplane(naval_group.um, node.unit_str, true);
			let node2 : naval_unit_graph_node;
			let ii = mymap.get(s2+node.num_submerge);
			if (ii == undefined) {
				node2 = new naval_unit_graph_node(naval_group.um, s2, node.num_submerge);
				node2.dlast = true;
				mymap.set(s2+ node.num_submerge, node2);
				myheap.push(node2);
				//console.log (node2, "push 5");
				//console.log (node2.index, "push 5");
			} else {
				node2 = ii;
			}
			node.next_dlast_subhit = node2;
		}
		if (naval_group.submerge_sub && node.num_subs > 0 && node.num_submerge == 0) {
			let [s2, num_submerge] = retreat_subs(naval_group.um, node.unit_str);
			let node2 : naval_unit_graph_node;
			let ii = mymap.get(s2 + num_submerge);
			if (ii == undefined) {
				node2 = new naval_unit_graph_node(naval_group.um, s2, num_submerge);
				if (node2.num_naval > 0) {
					node2.dlast = node.dlast;
				} else {
					node2.dlast = false;
				}
				mymap.set(s2+ num_submerge, node2);
				myheap.push(node2);
				//console.log (node2, "push 6");
				//console.log (node2.index, "push 6");
			} else {
				node2 = ii;
			}
			node.next_submerge = node2;
		}
    }

	//console.log("done queue");
    naval_group.nodeArr = nodeVec;
	//console.log(naval_group.nodeArr.length, "length");

    let i;
    for (i = 0; i< naval_group.nodeArr.length; i++) {
        node = naval_group.nodeArr[i];
		//console.log(i, node);

        // compute nextsub array
		node.nsubArr = [];

        let prev : naval_unit_graph_node | undefined = undefined;
        let node2 : naval_unit_graph_node | undefined;
        for (node2 = node; node2 != undefined && node2 != prev;
                node2 = node2.next_subhit) {
            prev = node2;
            node.nsubArr.push(node2.index);
        }
        if (prev == undefined)  {
			throw new Error();
        }
		for (let i = node.nsubArr.length; i < max_remove_hits; i++) {
			node.nsubArr.push(prev.index);
		}
	
        // compute nextair array
		node.nairArr = [];
		prev = undefined;
        for (node2 = node; node2 != undefined && node2 != prev;
                node2 = node2.next_airhit) {
            prev = node2;
            node.nairArr.push(node2.index);
        }
        if (prev == undefined)  {
			throw new Error();
        }
		for (let i = node.nairArr.length; i < max_remove_hits; i++) {
			node.nairArr.push(prev.index);
		}

		node.nnavalArr = [];
        // compute nextnaval array
		prev = undefined;
        for (node2 = node; node2 != undefined && node2 != prev;
                node2 = node2.next_navalhit) {
            prev = node2;
            node.nnavalArr.push(node2.index);
        }
        if (prev == undefined)  {
			throw new Error();
        }
		for (let i = node.nnavalArr.length; i < max_remove_hits; i++) {
			node.nnavalArr.push(prev.index);
		}

        // compute next_dlast_sub array
		node.ndlastsubArr = [];
		prev = undefined;

        for (node2 = node; node2 != undefined && node2 != prev;
                node2 = node2.next_dlast_subhit) {
            prev = node2;
            node.ndlastsubArr.push(node2.index);
        }
        if (prev == undefined)  {
			throw new Error();
        }
		for (let i = node.ndlastsubArr.length; i < max_remove_hits; i++) {
			node.ndlastsubArr.push(prev.index);
		}

        // compute nextair array
		node.ndlastairArr = [];
		prev = undefined;
        for (node2 = node; node2 != undefined && node2 != prev;
                node2 = node2.next_dlast_airhit) {
            prev = node2;
            node.ndlastairArr.push(node2.index);
        }
        if (prev == undefined)  {
			throw new Error();
        }
		for (let i = node.ndlastairArr.length; i < max_remove_hits; i++) {
			node.ndlastairArr.push(prev.index);
		}

		node.ndlastnavalArr = [];
        // compute nextnaval array
		prev = undefined;
        for (node2 = node; node2 != undefined && node2 != prev;
                node2 = node2.next_dlast_navalhit) {
            prev = node2;
            node.ndlastnavalArr.push(node2.index);
        }
        if (prev == undefined)  {
			throw new Error();
        }
		for (let i = node.ndlastnavalArr.length; i < max_remove_hits; i++) {
			node.ndlastnavalArr.push(prev.index);
		}

        if (node.num_subs == 0) {
            node.nosub_group = make_unit_group(naval_group.um, node.unit_str, naval_group.attdef);
        }
    }
	// aahits
	{
		node = naval_group.nodeArr[0];
        // compute nextsub array
		node.naaArr = [];
        let prev : naval_unit_graph_node | undefined = undefined;
        let node2 : naval_unit_graph_node | undefined;
        for (node2 = node; node2 != undefined && node2 != prev;
                node2 = node2.next_aahit) {
            prev = node2;
            node.naaArr.push(node2.index);
        }
	}
	//console.log("done queue 2");
    for (let i = 0; i < naval_group.nodeArr.length; i++) {
        node = naval_group.nodeArr[i];
		let red_str = get_reduced_group_string(node.unit_str);

		console.log(`${node.index}:  ${red_str} ${node.num_subs} ${node.num_air} ${node.num_naval} ${node.num_dest} ${node.dlast}`);
		//console.log(node);
    }
}

function make_unit_group(um : unit_manager, input_str : string, attdef : number) : unit_group 
{
	return um.unit_group_manager.get_or_create_unit_group(um, input_str, attdef);
}


function count_units (input : string, tok : string, last:number = 10000) : number
{
    let cnt = 0;
	let max = Math.min(last, input.length);
    for (let i = 0; i < input.length; i++) {
		let ch = input.charAt(i);
		if (ch == tok) {
			cnt++;
		}
    }
    return cnt;
}


function preparse_token(input : string, attdef : number) : string
{
	const space = " ";
	const comma = ",";

	let a = input.split(space).join("");
	let b = a.split(comma).join("");
	let out = ""
	let i = 0;
	let len = b.length;
	for (let i = 0; i < len; i++) {
		let term = b.substring(i, len);
		let c = parseInt(term);
		if (c > 0) {
			// number seen.
			let dd = c.toString();
			let e = dd.length;
			let unit = term.charAt(e);

			// c is the number of units (5)
			// e is the index of unit 'i'
			let temp = ""
			for (let j = 0; j < c; j++) {
				temp = temp + unit
			}
			let d = term.indexOf(unit);
			out = out + temp;
			i += e;
		} else {
			out = out + b.charAt(i);
		} 
	}

    return out;
}

function preparse_artillery(input : string , attdef : number) : string
{
    if (attdef != 0) {
		return input;
    }
    let size = input.length + 1;
	let out = input;

    let numArt = count_units(input, 'a');
    let cnt = 0;
    let ch : string
    for (let i = 0; i < out.length; i++) {
		let ch = out.charAt(i);
		if (ch == 'i') {
			if (cnt < numArt) {
				let newout;
				if (i > 0) {
					newout = out.substring(0, i) + 'd' + 	
								out.substring(i+1, out.length);
				} else {
					newout = 'd' + 	out.substring(1, out.length);
				}
				out = newout;
				cnt++;
			}
		}
    }
	return out;
}

function preparse_skipaa(input : string , attdef : number) : string
{
	let out = "";
	for (const ch of input) {
		if (ch == "c") {
			out += "e";
		} else {
			out += ch;
		}
	}
    return out;
}

function preparse_battleship(input : string , attdef : number) : string
{
	let out = input;
	let numBB = count_units(input, 'B');
	for (let i = 0; i< numBB; i++) {
		out += "E";		
	}
	return out;
}

function preparse(input : string, attdef : number, skipAA : boolean = false) : string
{
    let token_out = preparse_token(input, attdef);
    let art_out = preparse_artillery(token_out, attdef);
	if (isnaval) {
		let bat_out = preparse_battleship(art_out, attdef);
		return bat_out;
	}
	if (skipAA) {
		let aa_out = preparse_skipaa(art_out, attdef);
		return aa_out;
	}
    return art_out;
}

function run() 
{
	console.time('Execution Time');
	console.log(`debug = ${debug}`);
	console.log(`report_prune_threshold = ${report_prune_threshold}`);
	console.log(`prune_threshold = ${prune_threshold}`);
	console.log(`isnaval = ${isnaval}`);
	console.log(`attackers = ${attackers}`);
	console.log(`defenders = ${defenders}`);
	console.log(`strafe_threshold = ${strafe_threshold}`);
	console.log(debug);

	let attackers_internal = preparse(attackers, 0);
	let defenders_internal = preparse(defenders, 1);

	console.log(attackers_internal, `attackers_internal`);
	console.log(defenders_internal, `defenders_internal`);

	let um = new unit_manager();

	if (!isnaval) {
		console.time('init');
		let myprob = new problem(um, attackers_internal, defenders_internal, 1.0);
		myprob.set_prune_threshold(prune_threshold, early_prune_threshold, report_prune_threshold);
		console.timeEnd('init');

		let numAA = count_units(myprob.def_data.unit_str, 'c');
		if (numAA > 0) {
			for (let i = 0; i < num_runs; i++) {
				console.time('solveAA');
				solveAA(myprob, numAA);
				console.timeEnd('solveAA');
			}
		} else {

			for (let i = 0; i < num_runs; i++) {
				console.time('solve');
				solve(myprob, 0);
				console.timeEnd('solve');
			}
			let problemArr : problem[];
			problemArr = [];
			problemArr.push(myprob);
			let result_data : result_data_t[];
			result_data = [];
			
			console.time('post');
			collect_results(myprob, problemArr, 0, result_data);
			print_results(myprob, problemArr, result_data);
			console.timeEnd('post');
		}
	} else {
		console.time('solve_sub');
		console.time('init');
		console.profile("solve_sub");
		//debugger
		let myprob = new naval_problem(um, attackers_internal, defenders_internal, 1.0, 
			att_destroyer_last > 0, att_submerge > 0, def_destroyer_last > 0, def_submerge > 0);
		myprob.set_prune_threshold(prune_threshold, early_prune_threshold, report_prune_threshold);
		console.timeEnd('init');
		let problemArr : naval_problem[];
		problemArr = [];
		problemArr.push(myprob);
		for (let i = 0; i < num_runs; i++) {
			console.time('solve');
			solve_sub( myprob, 0);
			console.timeEnd('solve');
	    }

		let result_data : result_data_t[];
		result_data = [];
		console.time('post');
		collect_naval_results(myprob, problemArr, 0, result_data);
		print_naval_results(myprob, problemArr, result_data);
		console.profileEnd();
		console.timeEnd('post');
		console.timeEnd('solve_sub');
	}

	console.timeEnd('Execution Time');
}


interface aacalc_input {
	attacker : string;
	defender : string; 
	debug	: boolean;
	prune_threshold : number;
	report_prune_threshold : number;
	is_naval : boolean;
	is_in_progress : boolean;
	att_destroyer_last : boolean; 
	def_destroyer_last : boolean; 
	att_submerge_sub : boolean; 
	def_submerge_sub : boolean; 
	num_runs	: number;
	retreat_threshold : number;
	strafe_threshold : number;
	strafe_attpower_threshold : number;
	strafe_num_threshold : number;
	strafe_do_num_check : boolean;
	strafe_do_attpower_check : boolean;
}


interface aacalc_info {
	survives : number[] 
	ipcLoss : number[]
}

interface casualty_2d {
	attacker : string;
	defender : string;	
	attacker_casualty : string;
	defender_casualty : string;	
	prob : number;
}

interface casualty_1d {
	remain : string;
	casualty : string;
	prob : number;
}


interface aacalc_output {
	attack : aacalc_info;
	defense : aacalc_info;
	casualtiesInfo : casualty_2d[]
	att_cas : casualty_1d[]
	def_cas : casualty_1d[]
	takesTerritory : number[]
}

function aacalc(
		input : aacalc_input
		) 
   : aacalc_output
{
	let um = new unit_manager();

	let attackers_internal = preparse(input.attacker, 0);
	let defenders_internal = preparse(input.defender, 1, input.is_in_progress);
	console.log(attackers_internal, "attackers_internal");
	console.log(defenders_internal, "defenders_internal");
	
	if (!input.is_naval) {
		console.time('init');
		let myprob = new problem(um, attackers_internal, defenders_internal, 1.0);
		myprob.retreat_threshold = input.retreat_threshold;
		myprob.set_prune_threshold(input.prune_threshold, input.prune_threshold / 10, input.report_prune_threshold);
		console.timeEnd('init');

		let numAA = count_units(myprob.def_data.unit_str, 'c');
		if (numAA > 0) {
			console.time('solveAA');
			let output = solveAA(myprob, numAA);
			console.timeEnd('solveAA');
			return output;
		} else {
			for (let i = 0; i < input.num_runs; i++) {
				console.time('solve');
				solve(myprob, 0);
				console.timeEnd('solve');
			}
			let problemArr : problem[];
			problemArr = [];
			problemArr.push(myprob);
			let result_data : result_data_t[];
			result_data = [];
			
			console.time('post');
			collect_results(myprob, problemArr, 0, result_data);
			let output = print_results(myprob, problemArr, result_data);
			console.timeEnd('post');
			return output;
		}
	} else {
		console.time('solve_sub');
		console.time('init');
		console.profile("solve_sub");
		//debugger
		let myprob = new naval_problem(um, attackers_internal, defenders_internal, 1.0, 
			input.att_destroyer_last, input.att_submerge_sub, input.def_destroyer_last, input.def_submerge_sub);
		myprob.retreat_threshold = input.retreat_threshold;
		myprob.set_prune_threshold(input.prune_threshold, input.prune_threshold / 10, input.report_prune_threshold);
		console.timeEnd('init');
		let problemArr : naval_problem[];
		problemArr = [];
		problemArr.push(myprob);
		for (let i = 0; i < input.num_runs; i++) {
			console.time('solve');
			solve_sub( myprob, 0);
			console.timeEnd('solve');
	    }

		let result_data : result_data_t[];
		result_data = [];
		console.time('post');
		collect_naval_results(myprob, problemArr, 0, result_data);
		let output = print_naval_results(myprob, problemArr, result_data);
		console.profileEnd();
		console.timeEnd('post');
		console.timeEnd('solve_sub');
		return output;
	}
}

// 
function apply_ool(input : string, ool : string )  : string {
	if (ool == "") {
		return input;
	}

	let map : Map<string, number> = new Map();

	for (var char of input) {
		let v = map.get(char);
		if (v != undefined) {
			map.set(char, v + 1);
		} else {
			map.set(char, 1);
		}
	}
	let out = "";
	for (const ch of ool) {
		let cnt = map.get(ch);
		if (cnt == undefined) {
			continue;
		}
		for (let i = 0; i < cnt; i++) {
			out += ch;
		}
	}
	return out;
}

function run2() {
	console.time('Execution Time');
	console.log(`debug = ${debug}`);
	console.log(`report_prune_threshold = ${report_prune_threshold}`);
	console.log(`prune_threshold = ${prune_threshold}`);
	console.log(`isnaval = ${isnaval}`);
	console.log(`in_progress = ${in_progress}`);
	console.log(`attackers = ${attackers}`);
	console.log(`defenders = ${defenders}`);
	console.log(`strafe_threshold = ${strafe_threshold}`);
	console.log(`retreat_threshold = ${retreat_threshold1}`);
	console.log(debug);


/*
	let attackers_token = preparse_token(attackers, 0);
	let defenders_token = preparse_token(defenders, 1);
	let attackers_ool = apply_ool(attackers_token, att_ool);
	let defenders_ool = apply_ool(defenders_token, def_ool);
*/

	let input : aacalc_input;
	input = { attacker: attackers, defender: defenders, debug : debug > 0, prune_threshold : prune_threshold, 
			report_prune_threshold : report_prune_threshold, is_naval : isnaval > 0, 
			is_in_progress : in_progress,
			att_destroyer_last : att_destroyer_last > 0, 
			def_destroyer_last : att_destroyer_last > 0, 
			att_submerge_sub : att_submerge > 0, 
			def_submerge_sub : def_submerge > 0, 
			num_runs : num_runs,
			retreat_threshold : retreat_threshold1,
			strafe_threshold : -1,
			strafe_attpower_threshold : 0,
			strafe_num_threshold : 0,
			strafe_do_attpower_check : false,
			strafe_do_num_check : false
			 }
	console.log("input", input);
	
	let output = aacalc(input) 

	console.log ("output", output)

	console.timeEnd('Execution Time');
}


interface wave_input {
	attacker : string;
	defender : string;
	def_ool : string;
	att_submerge : boolean;
	def_submerge : boolean;
	att_dest_last : boolean;
	def_dest_last : boolean;
	retreat_threshold : number;
}


interface multiwave_input {
	wave_info : wave_input[];
	debug	: boolean;
	prune_threshold : number;
	report_prune_threshold : number;
	is_naval : boolean;
	num_runs	: number;
}

interface multiwave_output {
	out : aacalc_output;
	output : aacalc_output[]
}

function multiwave(
		input : multiwave_input
		) 
   : multiwave_output
{
	let umarr : unit_manager[] = [];
	let probArr : naval_problem[] = [];
	let um = new unit_manager();
	let um2 = new unit_manager();
	let um3 = new unit_manager();
	let output : aacalc_output[] = [];

	for (i = 0; i < input.wave_info.length; i++) {
		umarr.push (new unit_manager());
		let um = umarr[i];
		let wave = input.wave_info[i];

		let defend_add_reinforce : casualty_1d[] | undefined;
		defend_add_reinforce = undefined;
		let defenders_internal;
		if (i > 0) {
			let defend_dist = output[i-1].def_cas;
			let def_token = preparse_token(wave.defender, 1);
			defend_add_reinforce = [];
			for (let j = 0 ; j < defend_dist.length; j++) {
				let cas = defend_dist[j];
				let newcas = cas.remain + def_token;
				let p1; 
				let p2;
				if (cas.remain.length == 0 ) {
					//if attacker takes -- then no reinforce
					p1 = cas.prob - output[i-1].takesTerritory[0];
					p2 = output[i-1].takesTerritory[0];
				} else {
					p1 = cas.prob;
					p2 = 0;
				}
				let newcasstr = apply_ool(cas.remain + def_token, wave.def_ool);
			
				let newcasualty : casualty_1d = { remain : newcasstr, casualty : cas.casualty, prob : p1}
				defend_add_reinforce.push(newcasualty);
				if (p2 > 0) {
					let newcasstr = apply_ool(cas.remain, wave.def_ool);
					let newcasualty : casualty_1d = { remain : newcasstr, casualty : cas.casualty, prob : p2}
					//defend_add_reinforce.push(newcasualty);
				}
			}
			let defender = apply_ool(defend_add_reinforce[defend_add_reinforce.length-1].remain + 
						defend_add_reinforce[defend_add_reinforce.length-1].casualty, wave.def_ool);
			defenders_internal = preparse(defender, 1);

		} else {
			let defenders_token = preparse_token(wave.defender, 1);
			let defenders_ool = apply_ool(defenders_token, wave.def_ool);
			defenders_internal = preparse(defenders_ool, 1);
		}
		let attackers_internal = preparse(wave.attacker, 0);

		console.log(defend_add_reinforce, "defend_add_reinforce");
		probArr.push(new naval_problem(um, attackers_internal, defenders_internal, 1.0, 
			wave.att_dest_last, wave.att_submerge, wave.def_dest_last, wave.def_submerge, input.is_naval,
			defend_add_reinforce));
		let myprob = probArr[i];
		myprob.set_prune_threshold(input.prune_threshold, input.prune_threshold / 10, input.report_prune_threshold);
		let problemArr : naval_problem[];
		problemArr = [];
		problemArr.push(myprob);
		solve_sub( myprob, 0);

		let result_data : result_data_t[];
		result_data = [];
		collect_naval_results(myprob, problemArr, 0, result_data);
		let out = print_naval_results(myprob, problemArr, result_data);
		output.push(out);
		console.log(out, "wave", i);
	}

	let attsurvive : number[] = [];
	let defsurvive : number[] = [];
	let attipc : number[] = [];
	let defipc : number[] = [];
	let atttakes : number[] = [];
	for (i = 0; i < input.wave_info.length; i++) {
		let att_survives = output[i].attack.survives[0]
		let def_survives = output[i].defense.survives[0]
		let att_ipcLoss = output[i].attack.ipcLoss[0]
		let def_ipcLoss = output[i].defense.ipcLoss[0]
		let att_takes = output[i].takesTerritory[0]
		if (i > 0) {
			for (let j = 0 ; j < i; j++) {
				def_ipcLoss += (output[j].takesTerritory[0] * get_cost_from_str(probArr[j].um, probArr[j].def_data.unit_str, 0));
			}
			def_ipcLoss -= defipc[i-1];
			att_takes += atttakes[i-1];
		}
		attsurvive.push(att_survives);
		defsurvive.push(def_survives);
		attipc.push(att_ipcLoss);
		defipc.push(def_ipcLoss);
		atttakes.push(att_takes);
	}

	let out2 : aacalc_output = {
		attack : { survives : attsurvive, ipcLoss : attipc },
		defense : { survives : defsurvive, ipcLoss : defipc },
		casualtiesInfo : [],
		att_cas : [],
		def_cas : [],
		takesTerritory : atttakes
	}

	let out : multiwave_output = { 
		out: out2,
		output : output };
	return out;

}
function run3() {
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
			  retreat_threshold : retreat_threshold1 };
	wave2 = { attacker : attackers2, 
			  defender : defenders2,
			  def_ool : def_ool2,
			  att_submerge : false,
			  def_submerge : false,
			  att_dest_last : false,
			  def_dest_last : false,
			  retreat_threshold : retreat_threshold2 };
	wave3 = { attacker : attackers3, 
			  defender : defenders3,
			  def_ool : def_ool3,
			  att_submerge : false,
			  def_submerge : false,
			  att_dest_last : false,
			  def_dest_last : false,
			  retreat_threshold : retreat_threshold3 };
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