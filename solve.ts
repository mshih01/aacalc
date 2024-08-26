
import { Heap } from 'heap-js';

import { UnitIdentifier } from "./external";

const epsilon : number = 1e-9;

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

export class unit_manager {
	unit_stats : Map<string, unit_stat> ;
	rev_map : Map<string, string>;
	rev_map2 : Map<string, string>;
	rev_map3 : Map<UnitIdentifier, string>;
	unit_group_manager : unit_group_manager;
	constructor() {
		this.unit_stats = new Map();
		this.rev_map = new Map();
		this.rev_map2 = new Map();
		this.rev_map3 = new Map();
		this.init_units();
		this.unit_group_manager = new unit_group_manager();
	}
	init_units() {
		this.make_unit("", 'e', 'c', 0, 0, 5, 1, true, false, false, false, true, false, false);
		this.make_unit("AA", 'c', 'c', 0, 0, 5, 1, false, false, false, false, true, false, false);
		this.make_unit("Inf", 'i', 'i', 1, 2, 3, 1, true, false, false, false, false, false, false);
		this.make_unit("Inf_a", 'j', 'j', 1, 2, 3, 1, true, false, false, false, false, false, true);
		this.make_unit("Art", 'a', 'a', 2, 2, 4, 1, true, false, false, false, false, false, false);
		this.make_unit("Art_a", 'g', 'g', 2, 2, 4, 1, true, false, false, false, false, false, true);
		this.make_unit("", 'd', 'i', 2, 2, 3, 1, false, false, false, false, false, false, false);
		this.make_unit("", 'h', 'j', 2, 2, 3, 1, false, false, false, false, false, false, true);
		this.make_unit("Arm", 't', 't', 3, 3, 6, 1, true, false, false, false, false, false, false);
		this.make_unit("Arm_a", 'u', 'u', 3, 3, 6, 1, true, false, false, false, false, false, true);
		this.make_unit("Fig", 'f', 'f', 3, 4, 10, 1, false, false, false, true, false, false, false);
		this.make_unit("Bom", 'b', 'b', 4, 1, 12, 1, false, false, false, true, false, false, false);
		this.make_unit("ACC", 'A', 'A', 1, 2, 14, 1, false, false, false, false, false, false, false);
		this.make_unit("Cru", 'C', 'C', 3, 3, 12, 1, false, false, false, false, false, true, false);
		this.make_unit("Des", 'D', 'D', 2, 2, 8, 1, false, false, true, false, false, false, false);
		this.make_unit("Sub", 'S', 'S', 2, 1, 6, 1, false, true, false, false, false, false, false);
		this.make_unit("Bat", 'B', 'B', 4, 4, 20, 2, false, false, false, false, false, true, false);
		this.make_unit("", 'E', 'E', 0, 0, 0, 2, false, false, false, false, false, false, false);
		this.make_unit("Tra", 'T', 'T', 0, 0, 7, 1, false, false, false, false, false, false, false);
		this.make_unit("DBat", 'F', 'B', 4, 4, 20, 2, false, false, false, false, false, true, false);
		this.make_unit("+", '+', '+', 0, 0, 0, 0, false, false, false, false, false, false, false);
	}
	make_unit(fullname : string, ch : string, ch2 : string, att : number, def : number, cost : number, hits : number, isLand : boolean, isSub : boolean, 
			isDestroyer : boolean, isAir : boolean, isAA : boolean, isBombard : boolean, isAmphibious : boolean) {
		let unit = new unit_stat(fullname, ch, ch2, att, def, cost, hits, isLand, isSub, isDestroyer, isAir, isAA, isBombard, isAmphibious);
		this.unit_stats.set(ch, unit);
		this.rev_map.set(ch2, ch);
		this.rev_map2.set(fullname, ch);
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
			this.pless[i] = []
			this.pgreater[i] = []
			for (j = 0; j < this.tbl_size; j++) {
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
					this.pless[i][j] = this.get_prob_table(i, j);
				} else {
					this.pless[i][j] = this.pless[i][j-1] + this.get_prob_table(i, j);
				}
			}
		}
		// i units get j hits or greater/
		for (i = 0; i < this.tbl_size; i++) {
			for (j = i; j >= 0; j--) {
				if (j == i) {
					this.pgreater[i][j] = this.get_prob_table(i, j);
				} else {
					this.pgreater[i][j] = this.pgreater[i][j+1] + this.get_prob_table(i, j);
				}

			}
		}
	}
	compute_prob_table() {
		let ph = this.prob_hits;
		let tbl_sz = this.tbl_size;
		let i, j;
		this.set_prob_table(0, 0, 1.0);
		for (j =1; j < tbl_sz; j++) {
			this.set_prob_table(0, j, 0.0);
		}
		for (i = 1; i < tbl_sz; i++) {
			this.set_prob_table(i, 0, (1-ph[i]) * this.get_prob_table(i-1,0));
			for (j =1; j < tbl_sz; j++) {
				if (j > i) {
					this.set_prob_table(i, j, 0.0);
				} else {
					this.set_prob_table(i, j, ph[i] * this.get_prob_table(i-1, j-1) + 
												(1-ph[i]) * this.get_prob_table(i-1, j));
				}
			}
		}
		for (i = 0; i < tbl_sz; i++) {
			let maxp = -1;
			for (j =0; j <= i; j++) {
				maxp = Math.max(maxp, this.get_prob_table(i, j));
			}
			this.max_prob_table[i] = maxp;
		}
		//console.log(this);
	}
}

class naval_unit_graph_node {
	unit_str : string;
	retreat : string = "";
	N		: number;
	num_subs : number;
	num_air : number;
	num_naval : number;
	num_dest : number;
	cost : number;
	dlast : boolean = false;
	index : number = 0;
    next_aahit : naval_unit_graph_node | undefined = undefined;
    next_subhit : naval_unit_graph_node | undefined = undefined;
    next_airhit : naval_unit_graph_node | undefined = undefined;
    next_navalhit : naval_unit_graph_node | undefined = undefined;
    next_dlast_subhit : naval_unit_graph_node | undefined = undefined;
    next_dlast_airhit : naval_unit_graph_node | undefined = undefined;
    next_dlast_navalhit : naval_unit_graph_node | undefined = undefined;
    next_submerge : naval_unit_graph_node | undefined = undefined;
    next_retreat_amphibious : naval_unit_graph_node | undefined = undefined;
    next_crash_fighters : naval_unit_graph_node | undefined = undefined;
	naaArr : number[] = [];
	nsubArr : number[] = [];
	nairArr : number[] = [];
	nnavalArr : number[] = [];
	ndlastsubArr : number[] = [];
	ndlastairArr : number[] = [];
	ndlastnavalArr : number[] = [];
	nosub_group : unit_group | undefined= undefined;
	numBB : number = 0;
	constructor( um : unit_manager, unit_str : string, retreat : string, is_nonaval : boolean) {
		this.unit_str = unit_str;
		this.retreat = retreat;
		this.N = unit_str.length;
		this.num_subs = count_units(unit_str, 'S');
		this.num_air = count_units(unit_str, 'f') + count_units(unit_str, 'b');
		this.num_naval = this.N - this.num_subs - this.num_air;
		this.numBB = count_units(this.unit_str, 'E');
		this.num_dest = count_units(this.unit_str, 'D');
		this.cost = get_cost_from_str(um, unit_str, "");
		if (is_nonaval) {
			if (this.num_naval == 0) {
				this.cost += (this.num_subs * 1000);
			}
		}
	}
}

class naval_unit_group {
	um : unit_manager;
	unit_str : string = "";
	attdef : number = 0;
	destroyer_last : boolean = false;
	submerge_sub : boolean = false;
	is_crash_fighters : boolean = false;
	num_subs : number = 0;
	num_naval : number = 0;
	num_air : number = 0;
	num_aashot : number = 0;
	is_nonaval : boolean;
	sub_group : unit_group;
	naval_group : unit_group;
	air_group : unit_group;
	dlast_group : unit_group | undefined;

	nodeArr : naval_unit_graph_node[] = [];

	constructor (um : unit_manager, input_str : string, attdef : number, dest_last : boolean, submerge : boolean, 
						max_remove_hits : number, numAA : number ,
						cas : casualty_1d[] | undefined , 
					    is_nonaval : boolean , 	
						is_amphibious : boolean, 	
						crash_fighters : boolean) {
		this.um = um;
		this.unit_str = input_str;
		this.attdef = attdef;
		this.destroyer_last = dest_last;
		this.submerge_sub = submerge;
		this.num_subs = count_units(input_str, 'S');
		this.num_air = count_units(input_str, 'f') + count_units(input_str, 'b');
		this.num_naval = input_str.length - this.num_subs - this.num_air;
		this.is_nonaval = is_nonaval;
		this.is_crash_fighters = crash_fighters;
		let subs = ""
		for (let i = 0; i < this.num_subs; i++) {
			subs += 'S';
		}
		this.sub_group = make_unit_group(um, subs, attdef);

		let planes = "";
		for (let i = 0; i < input_str.length; i++) {
			let ch = input_str.charAt(i);
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

		this.naval_group = make_unit_group(um, naval, attdef);
		this.naval_group.first_destroyer_index = first_destroyer_index;

		if (first_destroyer_index >= 0) {
			let destlast = "D" + naval.substr(0, first_destroyer_index) + naval.substr(first_destroyer_index+1);
			this.dlast_group = make_unit_group(um, destlast, attdef);
		} else {
			this.dlast_group = this.naval_group;
		}
		compute_remove_hits(this, max_remove_hits, numAA, cas, is_amphibious );
	}
}

class naval_problem {
	um : unit_manager;
	is_naval : boolean;
	prob : number = 0;
	att_data : naval_unit_group;
	def_data : naval_unit_group;
	is_nonaval : boolean;
	is_retreat : boolean;			// rounds > 0 || retreat_threshold
	is_amphibious : boolean;		// attacker has amphibious units... and is_retreat
	is_crash_fighters : boolean;
	rounds : number = -1;
	average_rounds : number = -1;
	N : number;
	M : number;
	debug_level : number = 0;
	P_1d : number[] = [];
	nonavalproblem : naval_problem | undefined = undefined;
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
	attmap : Map<string, number>;
	defmap : Map<string, number>;
	attmap2 : Map<string, number>;
	defmap2 : Map<string, number>;
	getIndex(i : number, j : number) : number {
		return i * this.M + j;
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
	isEarlyRetreat() {
		return this.att_data.submerge_sub || this.def_data.submerge_sub
	}
    constructor(um : unit_manager, att_str : string, def_str : string, prob : number,
			att_dest_last : boolean, att_submerge : boolean , def_dest_last : boolean , def_submerge : boolean,
			rounds : number, 
			retreat_threshold : number,
			is_crash_fighters : boolean,
			is_naval : boolean = true,
			def_cas	: casualty_1d[] | undefined = undefined,
			is_nonaval : boolean = false
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

		this.is_retreat = ((rounds > 0) && (rounds < 100)) || (retreat_threshold > 0);
		this.retreat_threshold = retreat_threshold;
		this.is_crash_fighters = is_crash_fighters;
		this.rounds = rounds;
		this.is_amphibious = this.is_retreat && hasAmphibious (um, att_str);
		this.att_data = new naval_unit_group(um, att_str, 0, att_dest_last, att_submerge, max_def_hits+ 2, numAA, undefined, is_nonaval, this.is_amphibious, false);
		//console.log(this.att_data, `att`);
		this.def_data = new naval_unit_group(um, def_str, 1, def_dest_last, def_submerge, max_att_hits+ 2, 0, def_cas, is_nonaval, false, this.is_crash_fighters);
		this.N = this.att_data.nodeArr.length;
		this.M = this.def_data.nodeArr.length;

		//console.log(this.def_data, `def`);
		this.prob = prob;
		this.def_cas = def_cas;
		this.is_naval = is_naval;
		this.is_nonaval = is_nonaval;
		this.attmap = new Map();
		this.defmap = new Map();
		this.attmap2 = new Map();
		this.defmap2 = new Map();
		if (is_naval && !is_nonaval) {
			if (!att_submerge &&
				!def_submerge && 
				(this.att_data.num_subs > 0) &&
				(this.att_data.num_air > 0) &&
				(this.def_data.num_subs > 0) &&
				(this.def_data.num_air > 0) 
				) {
				let att = this.att_data.sub_group.unit_str + 
						this.att_data.air_group.unit_str;
				let def = this.def_data.sub_group.unit_str + 
						this.def_data.air_group.unit_str;
				this.nonavalproblem = new naval_problem(
						um, att, def, 0.0, 
						false, false, false, false, -1, 0, false, true,
						undefined, true);
				if (this.nonavalproblem != undefined) {
					for (let i = 0 ; i < this.att_data.nodeArr.length; i++) {
						let node = this.att_data.nodeArr[i];
						if (node.num_naval == 0) {
							let key : string = node.num_subs + "," + node.num_air;
							this.attmap.set(key, i);
						}
					}
					for (let i = 0 ; i < this.def_data.nodeArr.length; i++) {
						let node = this.def_data.nodeArr[i];
						if (node.num_naval == 0) {
							let key : string = node.num_subs + "," + node.num_air;
							this.defmap.set(key, i);
						}
					}
					for (let i = 0 ; i < this.nonavalproblem.att_data.nodeArr.length; i++) {
						let node = this.nonavalproblem.att_data.nodeArr[i];
						let key : string = node.num_subs + "," + node.num_air;
						this.attmap2.set(key, i);
					}
					for (let i = 0 ; i < this.nonavalproblem.def_data.nodeArr.length; i++) {
						let node = this.nonavalproblem.def_data.nodeArr[i];
						let key : string = node.num_subs + "," + node.num_air;
						this.defmap2.set(key, i);
					}
				}
			}
		}
		//console.log(this, `make_problem`);
	}
	setNoNavalP(N1 : number, M1 : number, N2 : number, M2 : number, p : number) {
		if (this.nonavalproblem != undefined) {
			let key1 : string = N1 + "," + N2;
			let key2 : string = M1 + "," + M2;
			let i = this.attmap2.get(key1);
			let j = this.defmap2.get(key2);
			if (i != undefined && j != undefined) {
				let ii  = this.nonavalproblem.getIndex(i, j);
				this.nonavalproblem.setiP(ii, this.nonavalproblem.getiP(ii) + p);
			} else {
				throw new Error();
			}
		} else {
			console.log("nonavalproblem");
			throw new Error();
		}
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
	fullname : string;
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
	isAmphibious : boolean;
	constructor(fullname : string, ch : string, ch2 : string, att : number, def : number, cost : number, hits : number, 
			isLand : boolean, isSub : boolean, isDestroyer : boolean, isAir : boolean, isAA : boolean, isBombard : boolean,
			isAmphibious : boolean) {
		this.fullname = fullname;
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
		this.isAmphibious = isAmphibious;
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


function remove_subhits2(node : naval_unit_graph_node , hits : number) : number
{
	let n = hits;
	return node.nsubArr[n];	
}
function remove_aahits( group : naval_unit_group, hits : number, index : number) : number 
{
    let node = group.nodeArr[index];
	let n = hits;
	return node.naaArr[n];	
}

function remove_dlast_subhits2(node : naval_unit_graph_node , hits : number) : number
{
	let n = hits;
	return node.ndlastsubArr[n];	
}

function remove_planehits2( node : naval_unit_graph_node , hasDest : boolean, hits : number) : number
{
	let n = hits;
	if (hasDest) {
		return node.nnavalArr[n];	
	} else {
		return node.nairArr[n];	
	}
}

function remove_dlast_planehits2( node : naval_unit_graph_node , hasDest : boolean, hits : number) : number
{
	let n = hits;
	if (hasDest) {
		return node.ndlastnavalArr[n];	
	} else {
		return node.ndlastairArr[n];	
	}
}

function remove_navalhits2( node : naval_unit_graph_node , hits : number) : number 
{
	let n = hits;
	return node.nnavalArr[n];	
}

function remove_dlast_navalhits2( node : naval_unit_graph_node, hits : number) : number 
{
	let n = hits;
	return node.ndlastnavalArr[n];	
}

function is_terminal_state(problem : naval_problem, N : number, M : number, debug : boolean) : boolean 
{
	let out = is_terminal_state_helper(problem, N, M);
	if (debug) {
		if (!out) {
			let attnode = problem.att_data.nodeArr[N];
			let defnode = problem.def_data.nodeArr[M];
			console.log(attnode.unit_str, ":", attnode.retreat, defnode.unit_str, "here");
		}
	}
	return out;
}

function is_terminal_state_helper(problem : naval_problem, N : number, M : number) : boolean 
{
    let attnode = problem.att_data.nodeArr[N];
    let defnode = problem.def_data.nodeArr[M];
    if (attnode.N == 0 || defnode.N == 0) {
        return true;
    }
	if (problem.retreat_threshold > 0) {
		if (attnode.N <= problem.retreat_threshold) {
			if (problem.is_amphibious) {
				if (attnode.next_retreat_amphibious == undefined && 
					attnode.N == 0) {
					return true;
				}
				return false;
			} 
			return true;
		}
	}
    let N1 = attnode.num_subs;
    let N2 = attnode.num_air;
    let N3 = attnode.num_naval;
    let M1 = defnode.num_subs;
    let M2 = defnode.num_air;
    let M3 = defnode.num_naval;
	if ((N1 > 0 && N2 == 0 && N3 == 0) && (M1 == 0 && M2 > 0 && M3 == 0)) {
        return true;
	}
	if ((M1 > 0 && M2 == 0 && M3 == 0) && (N1 == 0 && N2 > 0 && N3 == 0)) {
        return true;
	}
	return false;
}

function get_terminal_state_prob(problem : naval_problem, debug : boolean = false) : number {
	let N = problem.att_data.nodeArr.length;
	let M = problem.def_data.nodeArr.length;
	let prob = 0;

	for (let i = 0; i < N ; i++) {
		for (let j = 0; j < M ; j++) {
			let p = problem.getP(i, j);
			if (p > 0) {
				if (is_terminal_state(problem, i, j, debug)) {
					prob += p;
				}
			}
		}
	}
	return prob;
}

// if attackers and defenders exist.
	// 1.  remove move the remaining non-amphibous attackers to retreat state.
function retreat_one_naval_state(problem : naval_problem, N : number, M : number) 
{
    let attnode = problem.att_data.nodeArr[N];
    let defnode = problem.def_data.nodeArr[M];

    let p_init = problem.getP(N, M);

	if (p_init == 0) {
	    return;
	}

	if (attnode.N > 0 && defnode.N > 0 && attnode.retreat.length == 0 && attnode.next_retreat_amphibious != undefined) {
		let n = attnode.next_retreat_amphibious.index;
		let m = defnode.index;
		let ii = problem.getIndex(n, m);
		problem.setiP(ii, problem.getiP(ii) + p_init);
		problem.setP(N, M, 0);
		return;
	} 
}

function do_crash_fighters(problem : naval_problem)
{
    let N = problem.att_data.nodeArr.length;
    let M = problem.def_data.nodeArr.length;
	for (let i = 0; i < N; i++) {
		for (let j = 0; j < M; j++) {
			let attnode = problem.att_data.nodeArr[i];
			let defnode = problem.def_data.nodeArr[j];
			let p = problem.getP(i, j);
			if (p == 0) {
				continue;
			}
			if (defnode.next_crash_fighters != undefined) {
				problem.setP(i, j, 0);
				let n = attnode.index;
				let m = defnode.next_crash_fighters.index;
				let ii = problem.getIndex(n, m);
				problem.setiP(ii, problem.getiP(ii) + p);
			}
		}
	}
}

function solve_one_naval_state(problem : naval_problem, N : number, M : number, allow_same_state : boolean, numBombard : number, 
				do_retreat_only : boolean, disable_retreat : boolean)
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
	if (!disable_retreat && problem.retreat_threshold > 0) {
		if (attnode.N <= problem.retreat_threshold) {
			if (problem.is_amphibious) {
				if (attnode.N > 0 && defnode.N > 0 && attnode.retreat.length == 0 && attnode.next_retreat_amphibious != undefined) {
					let n = attnode.next_retreat_amphibious.index;
					let m = defnode.index;
					let ii = problem.getIndex(n, m);
					problem.setiP(ii, problem.getiP(ii) + p_init);
					problem.setP(N, M, 0);
					return;
				}
			} else {
				return;
			}
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
	if (do_retreat_only) {
		return;
	}

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
			let p = att_sub.get_prob_table(N1, 0) * def_sub.get_prob_table(M1, 0) * def_naval.get_prob_table(M3,0) *
						(1 - def_air.get_prob_table(M2, 0));	// > 0 plane hits... that don't apply.
			P0 += p;
		}
	}
    // defender all subs
	if (M1 > 0 && M2 == 0 && M3 == 0 && N2 > 0) {
		if (!att_destroyer) {
			let p = def_sub.get_prob_table(M1, 0) * att_sub.get_prob_table(N1, 0) * att_naval.get_prob_table(N3, 0) * 
						(1 - att_air.get_prob_table(N2, 0));    // > 0 plane hits... that don't apply.
			P0 += p;
		}
	}
		
	// attacker all planes.
	if (N1 == 0 && N2 > 0 && N3 == 0 && M1 > 0) {
		let p = att_air.get_prob_table(N2, 0) * def_naval.get_prob_table(M3, 0) * def_air.get_prob_table(M2, 0) * 
					(1 - def_sub.get_prob_table(M1, 0));
		P0 += p;
	}
	// defender all planes.
	if (M1 == 0 && M2 > 0 && M3 == 0 && N1 > 0) {
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

	let def_remove_subhits_function = remove_dlast_subhits2;
	let def_remove_planehits_function = remove_dlast_planehits2;
	let def_remove_navalhits_function = remove_dlast_navalhits2;
	if (!def_dlast) {
		def_remove_subhits_function = remove_dlast_subhits2;
		def_remove_planehits_function = remove_dlast_planehits2;
		def_remove_navalhits_function = remove_dlast_navalhits2;
	}
	let att_remove_subhits_function = remove_dlast_subhits2;
	let att_remove_planehits_function = remove_dlast_planehits2;
	let att_remove_navalhits_function = remove_dlast_navalhits2;
	if (!att_dlast) {
		att_remove_subhits_function = remove_subhits2;
		att_remove_planehits_function = remove_planehits2;
		att_remove_navalhits_function = remove_navalhits2;
	}
	problem.setP(N, M, 0);
	let sum = 0.0;

    if (!hasSubs && attnode.nosub_group != undefined && defnode.nosub_group != undefined ) {
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
			let m = remove_navalhits2(defnode, i);
			let p1 = att_nosub.get_prob_table(NNN, i) * r;
            for (j = 0; j <= MMM; j++) {
                prob = p1 * def_nosub.get_prob_table(MMM, j);
				let n = remove_navalhits2(attnode, j + numBombard);
				let ii = problem.getIndex(n, m);
				problem.setiP(ii, problem.getiP(ii) + prob);
            }
        }
	} else if (true && !problem.is_retreat && problem.is_naval && N3 == 0 && M3 == 0) {	// air vs. subs -- cannot hit each other... so can be solved independently.
		if (true && problem.nonavalproblem != undefined) {
			problem.setNoNavalP(N1, M1, N2, M2, p_init);
		} else {
			if (N1 > 0 && M1 > 0) {
				let P0 = att_sub.get_prob_table(N1, 0) * def_sub.get_prob_table(M1, 0);
				let r = p_init * 1/(1-P0);
				if (allow_same_state) {
					r = p_init;
				}
				for (let i1 = 0; i1 <= N1; i1++) {
					let m = def_remove_subhits_function(defnode, i1);
					let p1 =  att_sub.get_prob_table(N1, i1) * r;
					for (let j1 = 0; j1 <= M1; j1++) {
						let n = att_remove_subhits_function(attnode, j1);
						let p2 = p1 * def_sub.get_prob_table(M1, j1);
						let ii = problem.getIndex(n, m);
						problem.setiP(ii, problem.getiP(ii) + p2);
					}
				}
			} else if (N2 > 0 && M2 > 0) {
				let P0 = att_air.get_prob_table(N2, 0) * def_air.get_prob_table(M2, 0);
				let r = p_init * 1/(1-P0);
				if (allow_same_state) {
					r = p_init;
				}
				for (let i2 = 0; i2 <= N2; i2++) {
					let m = def_remove_planehits_function(defnode, false, i2);
					let p1 =  att_air.get_prob_table(N2, i2) * r;
					for (let j2 = 0; j2 <= M2; j2++) {
						let n = att_remove_planehits_function(attnode, false, j2);
						let p2 = p1 * def_air.get_prob_table(M2, j2);
						let ii = problem.getIndex(n, m);
						problem.setiP(ii, problem.getiP(ii) + p2);
					}
				}
			} else {
				console.log("unexpected -- nonaval resolution");
				throw new Error();
			}
		}
	} else {
		if (true && (N1 * M1 > 2)) {
			let m = remove_subhits2(defnode, N1);
			let n = remove_subhits2(attnode, M1);
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
		// if not first strike && other side doesn't have planes -- then treat sub his as unconstrained and remove last
		let attack_sub_unconstrained = false; 
		let defend_sub_unconstrained = false; 
		if (N1 > 0 && def_destroyer && M2 == 0 && N2 > 0) {
			attack_sub_unconstrained = true;
		} 
		if (M1 > 0 && att_destroyer && N2 == 0 && M2 > 0) {
			defend_sub_unconstrained = true;
		} 
		//console.log(attack_sub_unconstrained, defend_sub_unconstrained, "attack_sub_unconstrained, defend_sub_unconstrained");
		//attack_sub_unconstrained = false; 
		//defend_sub_unconstrained = false; 
        for (i1 = 0; i1 <= N1; i1++) {
            newN1 = N1;
            newN2 = N2;
            newN3 = N3;
            newM1 = M1;
            newM2 = M2;
            newM3 = M3;
			let defnode2 = attack_sub_unconstrained ? defnode : problem.def_data.nodeArr[def_remove_subhits_function(defnode, i1)];
			let att_sub_unconstrained_hits = attack_sub_unconstrained ? i1 : 0;
            if (!def_destroyer)  {
				if (defnode2 == undefined) {
					console.log(i1, M, problem.def_data.nodeArr[M], problem.def_data.nodeArr[M].nsubArr,  "undefined remove sub");
				}
                newM1 = defnode2.num_subs;
                newM2 = defnode2.num_air;
                newM3 = defnode2.num_naval;
            }
            for (j1 = 0; j1 <= M1; j1++) {
				let attnode2 = defend_sub_unconstrained ? attnode : problem.att_data.nodeArr[att_remove_subhits_function(attnode, j1)];
			    let def_sub_unconstrained_hits = defend_sub_unconstrained ? j1 : 0;
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
				let ept5 = ept1 * maxV3;
				let ept6 = ept0 * maxV2 * maxV4;
				let ept7 = ept2 * maxV4;
                if (prob < ept0) {
                    continue;
                }


				if ((att_destroyer || def_destroyer) && attnode.nosub_group != undefined && defnode.nosub_group != undefined ) {
					if (att_destroyer && def_destroyer) {
						let att_nosub = attnode.nosub_group;
						let def_nosub = defnode.nosub_group;
						let i, j;
						let NNN = N2 + N3;
						let MMM = M2 + M3;
						let m, n;
						for (i = 0; i <= NNN; i++) {
							let p1 = att_nosub.get_prob_table(NNN, i) * prob;
							if (p1 < ept5) {
								continue;
							}
							let m = def_remove_navalhits_function(defnode2, i + att_sub_unconstrained_hits);
							for (j = 0; j <= MMM; j++) {
								let p2 = p1 * def_nosub.get_prob_table(MMM, j );
								if (p2 < ept4) {
									continue;
								}
								let n = att_remove_navalhits_function(attnode2, j + def_sub_unconstrained_hits );
								let ii = problem.getIndex(n, m);
								problem.setiP(ii, problem.getiP(ii) + p2);
							}
						}
					} else if (att_destroyer) {
						let att_nosub = attnode.nosub_group;
						let def_nosub = defnode.nosub_group;
						let i, j;
						let NNN = N2 + N3;
						let MMM = M2 + M3;
						let m, n;
						for (i = 0; i <= NNN; i++) {
							let p1 = att_nosub.get_prob_table(NNN, i) * prob;
							if (p1 < ept5) {
								continue;
							}
							let m = def_remove_navalhits_function(defnode2, i );
							for (j2 = 0; j2 <= newM2; j2++) {
								p3 = p1 * def_air.get_prob_table(newM2, j2);
								if (p3 < ept3) {
									continue;
								}
								let n2 = att_remove_planehits_function(attnode2, def_destroyer, j2);
								let attnode3 = problem.att_data.nodeArr[n2];
									for (j3 = 0; j3 <= newM3; j3++) {
										p5 = p3 * def_naval.get_prob_table(newM3, j3);
										if (p5 < ept4) {
											continue;
										}
										let n3 = att_remove_navalhits_function(attnode3, j3 + def_sub_unconstrained_hits);
										let ii = problem.getIndex(n3, m);
										problem.setiP(ii, problem.getiP(ii) + p5);
									}
							}
						}
					} else {
						let att_nosub = attnode.nosub_group;
						let def_nosub = defnode.nosub_group;
						let i, j;
						let NNN = N2 + N3;
						let MMM = M2 + M3;
						let m, n;
						for (j = 0; j <= MMM; j++) {
							let p1 = prob * def_nosub.get_prob_table(MMM, j);
							if (p1 < ept6) {
								continue;
							}
							let n = att_remove_navalhits_function(attnode2, j);
							for (i2 = 0; i2 <= newN2; i2++) {
								p3 = p1 * att_air.get_prob_table(newN2, i2);
								if (p3 < ept7) {
									continue;
								}
								let m2 = def_remove_planehits_function(defnode2, att_destroyer, i2);
								let defnode3 = problem.def_data.nodeArr[m2];
									for (i3 = 0; i3 <= newN3; i3++) {
										p5 = p3 * att_naval.get_prob_table(newN3, i3);
										if (p5 < ept4) {
											continue;
										}
										let m3 = def_remove_navalhits_function(defnode3, i3 + att_sub_unconstrained_hits);
											let ii = problem.getIndex(n, m3);
											problem.setiP(ii, problem.getiP(ii) + p5);
									}
							}
						}
					}
				} else {
					for (i2 = 0; i2 <= newN2; i2++) {
						p2 = prob * att_air.get_prob_table(newN2, i2);
						if (p2 < ept1) {
							continue;
						}
						let m2 = def_remove_planehits_function(defnode2, att_destroyer, i2);
						let defnode3 = problem.def_data.nodeArr[m2];
						for (j2 = 0; j2 <= newM2; j2++) {
							p3 = p2 * def_air.get_prob_table(newM2, j2);
							if (p3 < ept2) {
								continue;
							}
							let n2 = att_remove_planehits_function(attnode2, def_destroyer, j2);
							let attnode3 = problem.att_data.nodeArr[n2];
							for (i3 = 0; i3 <= newN3; i3++) {
								p4 = p3 * att_naval.get_prob_table(newN3, i3);
								if (p4 < ept3) {
									continue;
								}
								let m3 = def_remove_navalhits_function(defnode3, i3 + att_sub_unconstrained_hits);
								for (j3 = 0; j3 <= newM3; j3++) {
									p5 = p4 * def_naval.get_prob_table(newM3, j3);
									if (p5 < ept4) {
										continue;
									}
									let n3 = att_remove_navalhits_function(attnode3, j3 + def_sub_unconstrained_hits);
									let ii = problem.getIndex(n3, m3);
									problem.setiP(ii, problem.getiP(ii) + p5);
								}
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

	let p_init = problem.getP(N, M);

	if (p_init == 0) {
	    return;
	}
    if (p_init < problem.prune_threshold) {
		problem.setP(N, M, 0);
		return;
    }
	if (problem.retreat_threshold > 0) {
		if (N <= problem.retreat_threshold) {
			return;
		}
	}

	let att_data = problem.att_data;
	let def_data = problem.def_data;

	let P0 = att_data.get_prob_table(N, 0) * def_data.get_prob_table(M, 0);
	let r = 1/(1-P0);
	if (allow_same_state) {
		r = 1.0;
	}
	r = r * p_init;
    let prob;
    let i,j;
    let new_i, new_j;
	problem.setP(N, M, 0);
    /*  i att hits, j def hits */
    for (i = 0; i <= N;i++) {
		let p =  att_data.get_prob_table(N, i) * r;
        for (j = 0; j <= M; j++) {
			prob = p * def_data.get_prob_table(M, j);
            new_i = N-j - numBombard;
            new_j = M-i;
            if (new_i < 0) new_i = 0;
            if (new_j < 0) new_j = 0;
			let ii = problem.getIndex(new_i, new_j);
            problem.setiP(ii, problem.getiP(ii) + prob);
        }
    }
    if (!allow_same_state) {
		problem.setP(N, M, 0);
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

function hasAmphibious(um : unit_manager, input : string) : boolean {
	for (let i = input.length-1; i >= 0; i--) {
		let ch = input.charAt(i);
		let stat = um.get_stat(ch);
		if (stat.isAmphibious) {
			return true;
		}
	}
	return false;
}  

function hasNonAAUnit(um : unit_manager, input : string) : boolean {
	for (let i = input.length-1; i >= 0; i--) {
		let ch = input.charAt(i);
		let stat = um.get_stat(ch);
		if (!stat.isAA) {
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
function retreat_subs(um : unit_manager, input_str : string) : [string, number, string]
{
	let N = input_str.length;
	let out = ""
	let subs = ""
	let num_subs = 0;
	for (let i = 0; i < N; i++) {
		let ch = input_str.charAt(i);
		if (!isSub(um, ch)) {
			out = out + ch;
		} else {
			num_subs++;
			subs += "S"
		}
	}
	return [out, num_subs, subs];
}

function crash_fighters(um : unit_manager, input_str : string) : string
{
	let num_acc = count_units(input_str, 'A');
	let max_num_fighters = num_acc * 2;

	let N = input_str.length;
	let out = ""
	let num_fighters = 0;
	for (let i = 0; i < N; i++) {
		let ch = input_str.charAt(i);
		let stat = um.get_stat(ch);
		if (!stat.isAir) {
			out = out + ch;
		} else {
			num_fighters++;
			if (num_fighters <= max_num_fighters) {
				out = out + ch;
			} 
		}
	}
	return out;
}

function retreat_non_amphibious(um : unit_manager, input_str : string) : [string, string]
{
	let N = input_str.length;
	let out = ""
	let retreat = ""
	for (let i = 0; i < N; i++) {
		let ch = input_str.charAt(i);
		let stat = um.get_stat(ch);
		if (stat.isAmphibious) {
			out += ch;
		} else {
			retreat += ch;
		}
	}
	return [out, retreat];
}


function report_filter (threshold : number, p : number) : number {
    if (p < threshold) {
		return 0;
	}
	return p;
}

export function get_cost_from_str(um : unit_manager, s : string, retreat : string = "") : number
{
    let cost = 0;
    let i;
    let j = 0;
    for (i = 0; i < s.length; i++) {
        let ch = s.charAt(i);
		let stat = um.get_stat(ch);
        cost += stat.cost;
    }
    for (i = 0; i < retreat.length; i++) {
        let ch = retreat.charAt(i);
		let stat = um.get_stat(ch);
        cost += stat.cost;
	}
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
	if (node.retreat.length > 0) {
		cost += get_cost_from_str(um, node.retreat);
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
            let p = report_filter(problem.report_prune_threshold, problem.getP(i, j));
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
            let p = report_filter(problem.report_prune_threshold, problem.getP(i, j));
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
		[string, string]
{
	let out = "";
	let node = group.nodeArr[sz];
	if (node.retreat.length > 0) {
		out += node.retreat;
	}
	let out1 = ""
	for (const ch of node.unit_str) {
		if (ch == "") {
			continue;
		}
		let stat = um.get_stat(ch);
		out1 += stat.ch2;
	}
	return [out1, out];
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
		let stat = um.get_stat(key);
		
		out = out + value + " " + stat.fullname + ", "
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
			let stat = um.get_stat(ch);
			if (stat.isBombard) {
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
	let mymap : Map<string, number> = new Map();
	let units_remain = node.unit_str + node.retreat;
	let baseunits =  group.nodeArr[0].unit_str;

	for (const ch of baseunits) {
		let stat = problem.um.get_stat(ch);
		let ch2 = stat.ch2;
		let cnt = mymap.get(ch2);
		if (cnt == undefined) {
			mymap.set(ch2, 1);
		} else {
			mymap.set(ch2, cnt + 1);
		}
	}
	
	for (const ch of units_remain) {
		let stat = problem.um.get_stat(ch);
		let ch2 = stat.ch2;
		let cnt = mymap.get(ch2);
		if (cnt == undefined) {
			console.log ("fatal");
			throw new Error();
		} else {
			mymap.set(ch2, cnt -1);
		}
	}

	let casualty = "";
	let cost = 0;
	for (let [ch2, cnt] of mymap) {
		let stat = problem.um.get_stat(ch2);
		if (skipBombard && stat.isBombard) {
			continue;
		}
		cost += stat.cost * cnt;	
		for (let i = 0 ; i < cnt; i++) {
			casualty += ch2;
		}
	}
	
	return [cost, casualty];
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
        let p = report_filter(problem.report_prune_threshold, result.p);
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
			let cas : casualty_2d = { attacker : red_att, defender : red_def, 
						attacker_retreat : "", defender_retreat: "",
						attacker_casualty : red_att_cas, defender_casualty : red_def_cas, prob : p}
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
			let cas : casualty_1d = { remain : att, casualty : att_cas, prob : p, retreat: ""}
			att_cas_1d.push(cas);
		} else {
			console.log("FATAL -- undefind");
			throw new Error();
		}
	}

	for (let [def, p] of def_map) {
		let def_cas = def_cas_map.get(def);
		if (def_cas != undefined) {
			let cas : casualty_1d = { remain : def, casualty : def_cas, prob : p, retreat: ""}
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
				rounds : -1,
				takesTerritory : [takes, 0, 0]
			};

	return output;
}


function print_naval_results(
		baseproblem : naval_problem,
		problemArr : naval_problem[],
		resultArr : result_data_t[], 
		doMerge : boolean = true ) : aacalc_output
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
	
	let mergedArr;
	if (doMerge) {
        mergedArr = merge_results(sortedArr);
	} else{
		mergedArr = sortedArr;
    }

	let N = baseproblem.att_data.nodeArr.length;
	let M = baseproblem.def_data.nodeArr.length;
    let att : string;
    let def : string;
    let retreat_att : string;
    let retreat_def : string;
    let red_att : string;
    let red_def : string;
    let att_casualty : string;
    let def_casualty : string;
    let red_att_cas : string;
    let red_def_cas : string;

    [att, retreat_att] = get_naval_group_string(baseproblem.um, baseproblem.att_data, 0);
    [def, retreat_def] = get_naval_group_string(baseproblem.um, baseproblem.def_data, 0);
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
        [att, retreat_att] = get_naval_group_string(problem.um, problem.att_data, result.i);
        [def, retreat_def] = get_naval_group_string(problem.um, problem.def_data, result.j);
        let red_retreat_att = get_reduced_group_string(retreat_att);
        let red_retreat_def = get_reduced_group_string(retreat_def);
        red_att = get_reduced_group_string(att);
        red_def = get_reduced_group_string(def);
        let  [att_loss, att_casualty] = get_naval_cost(problem, problem.att_data, result.i)
        let  [def_loss, def_casualty] = get_naval_cost(problem, problem.def_data, result.j)
        red_att_cas = get_reduced_group_string(att_casualty);
        red_def_cas = get_reduced_group_string(def_casualty);
        let p = report_filter(problem.report_prune_threshold, result.p);
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
			if (!baseproblem.is_naval && hasLand(problem.um, att)  && def.length == 0) {
				takes += p;
			}
			//console.log(`result:  P[%d][%d] ${red_att} vs. ${red_def} = ${p} cumm(${result.cumm}) rcumm(${result.rcumm}) (${result.cost})`, result.i, result.j);
			console.log(`result:  P[%d][%d] ${red_att}:${red_retreat_att} vs. ${red_def}:${red_retreat_def} (loss ${red_att_cas} ${att_loss} vs. ${red_def_cas} ${def_loss})= ${p} cumm(${result.cumm}) rcumm(${result.rcumm}) (${result.cost})`, result.i, result.j);
			let cas : casualty_2d = { attacker : red_att, defender : red_def, 
					attacker_retreat : red_retreat_att, defender_retreat : red_retreat_def,
					attacker_casualty : red_att_cas, defender_casualty : red_def_cas, prob : p}
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
		//console.log(i, p, "i, p");
        let [att, retreat_att] = get_naval_group_string(baseproblem.um, baseproblem.att_data, i);
        let  [att_loss, att_cas] = get_naval_cost(baseproblem, baseproblem.att_data, i)
		let cas : casualty_1d = { remain : att, retreat: retreat_att, casualty : att_cas, prob : p}
		att_cas_1d.push(cas);
	}
	//console.log("att_cas_1d", JSON.stringify(att_cas_1d, null, 4));

	for (let [j, p] of def_map) {
		//console.log(j, p, "j, p");
        let [def, retreat_def] = get_naval_group_string(baseproblem.um, baseproblem.def_data, j);
        let  [def_loss, def_cas] = get_naval_cost(baseproblem, baseproblem.def_data, j)
		let cas : casualty_1d = { remain : def, retreat: retreat_def, casualty : def_cas, prob : p}
		def_cas_1d.push(cas);
	}
	//console.log("def_cas_1d", JSON.stringify(def_cas_1d, null, 4));
	
	//console.log(casualties);
    let output : aacalc_output = {
				attack : { survives : [attsurvive, 0, 0], ipcLoss : [totalattloss, 0, 0]},
				defense : { survives : [defsurvive, 0, 0], ipcLoss : [totaldefloss, 0, 0]},
				casualtiesInfo : casualties,	
				att_cas : att_cas_1d,	
				def_cas : def_cas_1d,	
				rounds : baseproblem.average_rounds,
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

    let N = aa_data.tbl_size;


	let att_str = myprob.att_data.unit_str;
	let att_cas = "";
	let problemArr : problem[];
	problemArr = [];

    for (let i = 0; i < N; i++) {
		console.log(i, `solveAA i`);
		let prob = aa_data.get_prob_table(N-1, i);
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
	if (problem.nonavalproblem != undefined) {
		problem.nonavalproblem.P_1d = [];
		let N = problem.nonavalproblem.att_data.nodeArr.length;
		let M = problem.nonavalproblem.def_data.nodeArr.length;
		let i, j;
		for (i = 0; i < N; i++) {
			for (j = 0; j < M; j++) {
				problem.nonavalproblem.setP(i, j, 0.0);
			}
		}
	}

	if (problem.def_cas == undefined) {
		/* initial seed */
		problem.setP(0, 0, problem.prob);
		let doAA = !problem.is_naval &&
				problem.att_data.num_aashot > 0 && 
				hasNonAAUnit(problem.um, problem.def_data.unit_str);
		if (doAA) {
			let aashots = ""
			for (let i =0; i < problem.att_data.num_aashot; i++) {
				aashots = aashots + 'c';
			}
			let aa_data = make_unit_group(problem.um, aashots, 2);

			let N = aa_data.tbl_size;
			for (let i = 0; i < N; i++) {
				let prob = aa_data.get_prob_table(N-1, i);
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
				let doAA = !problem.is_naval &&
						numAA > 0 && 
						problem.att_data.num_aashot > 0 && 
						hasNonAAUnit(problem.um, problem.def_cas[i].remain);
				if (doAA && N != undefined && aa_data != undefined) {
					let NN = Math.min(numAA * 3 + 1, N);
					
					for (let i = 0; i < NN; i++) {
						let prob = aa_data.get_prob_table(NN-1, i);
						let n = remove_aahits( problem.att_data, i, 0);
						problem.setP(n, ii, p * prob);
						console.log(i, n, problem.prob * prob, "i, n, prob -- solveAA");
					}
				}
			}
		}	
	}

	// naval bombard
	
	let didBombard = false;
	if (!problem.is_naval) {
		let numBombard = 
				count_units(problem.att_data.unit_str, 'B') + 
				count_units(problem.att_data.unit_str, 'C');
		
		if (numBombard > 0)  {
			for (i = N-1; i >= 0 ; i--) {
				for (j = M-1; j >= 0 ; j--) {
					solve_one_naval_state(problem, i, j, true, numBombard, false, false);
				}
			}
			didBombard = true;
		}
	}

	if (problem.rounds > 0) {
		let rounds = didBombard ? problem.rounds - 1 : problem.rounds;
		let prob_ends : number[] = [];
		console.log(rounds, "rounds");
		let needs_early_retreat = problem.isEarlyRetreat() || problem.is_amphibious;
		if (didBombard) {
			if (needs_early_retreat) {
				for (i = N-1; i >= 0 ; i--) {
					for (j = M-1; j >= 0 ; j--) {
						solve_one_naval_state(problem, i, j, true, 0, true, false);
					}
				}
			}
			let p = get_terminal_state_prob(problem, true);
			prob_ends.push(p);
			console.log(prob_ends, "prob ends");
		}
		for (let ii = 0; ii < rounds; ii++) {
			for (i = N-1; i >= 0 ; i--) {
				for (j = M-1; j >= 0 ; j--) {
					solve_one_naval_state(problem, i, j, true, 0, false, false);
				}
			}
			if (needs_early_retreat) {
				for (i = N-1; i >= 0 ; i--) {
					for (j = M-1; j >= 0 ; j--) {
						solve_one_naval_state(problem, i, j, true, 0, true, false);
					}
				}
			}
			let debug = false && prob_ends.length == 8;
			let p = get_terminal_state_prob(problem, debug);
			prob_ends.push(p);
			if (false || debug) {
				console.log (ii, "round", prob_ends);
				collect_and_print_results(problem);
			}
			if (p == prob_ends[ii-1]) {
				break;
			}
		}
		if (problem.is_amphibious && prob_ends.length >= rounds ) {
			
			// for each state
				// if attackers and defenders exist.
					// 1.  remove move the remaining non-amphibous attackers to retreat state.
			
			for (let i = N-1; i >= 0 ; i--) {
				for (let j = M-1; j >= 0 ; j--) {
					retreat_one_naval_state(problem, i, j);
				}
			}
			let p = get_terminal_state_prob(problem);
			prob_ends[prob_ends.length-1] = p;
			// evaluate infinite rounds -- with retreat disabled. -- remaining attackers are not allowed to retreat.
			for (let ii = 0; ii < 100; ii++) {
				for (i = N-1; i >= 0 ; i--) {
					for (j = M-1; j >= 0 ; j--) {
						solve_one_naval_state(problem, i, j, true, 0, false, true);
					}
				}
				let p = get_terminal_state_prob(problem);
				prob_ends.push(p);
				if (p == prob_ends[prob_ends.length-2]) {
					break;
				}
			}
		}
		if (!problem.is_amphibious) {
			prob_ends[prob_ends.length-1] = 1.0;
		}
		console.log(prob_ends.length, "stopped after rounds");
		console.log(prob_ends, "stopped after rounds");
		let sum = 0.0
		for (let i = 0; i < prob_ends.length; i++) {
			let p = (i > 0) ? prob_ends[i] - prob_ends[i-1] : prob_ends[i];
			sum += ((i+1) * p);
		}
		console.log(sum, "average rounds");
		problem.average_rounds = sum;
    } else {
		for (i = 0; i < N ; i++) {
			for (j = 0; j < M ; j++) {
				solve_one_naval_state(problem, i, j, false, 0, false, false);
			}
		}
	}

	if (problem.is_crash_fighters) {
		console.log("before crash")
		collect_and_print_results(problem);
		do_crash_fighters(problem);
		console.log("after crash")
		collect_and_print_results(problem);
	}


	if (problem.nonavalproblem != undefined) {
		let N = problem.nonavalproblem.att_data.nodeArr.length;
		let M = problem.nonavalproblem.def_data.nodeArr.length;
		let i, j;

		for (i = 0; i < N; i++) {
			for (j = 0; j < M; j++) {
				solve_one_naval_state(problem.nonavalproblem, i, j, false, 0, false, false);
			}
		}
		// map back to parent problem
		let sum = 0;
		for (i = 0; i < N; i++) {
			let attnode = problem.nonavalproblem.att_data.nodeArr[i];
			let key : string = attnode.num_subs + "," + attnode.num_air;
			let ii = problem.attmap.get(key);
			for (j = 0; j < M; j++) {
				let node = problem.nonavalproblem.def_data.nodeArr[j];
				let key2 : string = node.num_subs + "," + node.num_air;
				let jj = problem.defmap.get(key2);
				let p = problem.nonavalproblem.getP(i, j)
				if (p > 0) {
				    //console.log(attnode.num_subs, attnode.num_air, node.num_subs, node.num_air, p, "p here");
					if (ii == undefined || jj == undefined) {
						console.log(key, key2, "key, key2");
						throw new Error();
					}
					let iii = problem.getIndex(ii, jj);
					problem.setiP(iii, problem.getiP(iii) + p);
					sum += p;
				}
			}
		}
		console.log(sum, "sum");
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



function make_node_key(s : string, retreat : string) {
	return s + ";" + retreat;
}

function compute_remove_hits(naval_group : naval_unit_group, max_remove_hits : number, numAA : number, cas : casualty_1d[] | undefined,
					is_amphibious : boolean )
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
	//console.log(naval_group);
    let node = new naval_unit_graph_node(naval_group.um, s, "", naval_group.is_nonaval);
	node.dlast = false;

	let nodeVec : naval_unit_graph_node[];
	nodeVec = [];
	let mymap : Map<string, naval_unit_graph_node> = new Map();
	let q : number[];
	q = [];
	// information to uniquely identify a node
	const mycompare = (a : naval_unit_graph_node , b : naval_unit_graph_node) => b.cost - a.cost;
	let myheap = new Heap(mycompare);
    mymap.set(make_node_key(s, ""), node);
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
				nnode = new naval_unit_graph_node(naval_group.um, att_str, "", naval_group.is_nonaval);
				myheap.push(nnode);
				mymap.set(make_node_key(att_str,""), nnode);
				prev.next_aahit = nnode;
			}
			prev = nnode;
		}
		prev.next_aahit = prev;
	}

	if (cas != undefined) {
		for (let i = 0; i < cas.length; i++) {
			let s = cas[i].remain;
			let key = make_node_key(s, "");
			let ii = mymap.get(key);
			if (ii == undefined) {
				let newnode = new naval_unit_graph_node(naval_group.um, s, "", naval_group.is_nonaval);
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
		
		let key = make_node_key(s, node.retreat);
		let ii = mymap.get(key);
        if (ii == undefined) {
			newnode = new naval_unit_graph_node(naval_group.um, s, node.retreat, naval_group.is_nonaval);
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
			let key = make_node_key(s2, node.retreat);
			let ii = mymap.get(key);
			if (ii == undefined) {
				node2 = new naval_unit_graph_node(naval_group.um, s2, node.retreat, naval_group.is_nonaval);
				if (node2.num_naval > 0) {
					node2.dlast = node.dlast;
				} else {
					node2.dlast = false;
				}
				mymap.set(key, node2);
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
			let key = make_node_key(s2, node.retreat);
			let ii = mymap.get(key);
			if (ii == undefined) {
				node2 = new naval_unit_graph_node(naval_group.um, s2, node.retreat, naval_group.is_nonaval);
				if (node2.num_naval > 0) {
					node2.dlast = node.dlast;
				} else {
					node2.dlast = false;
				}
				mymap.set(key, node2);
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
			let key = make_node_key(s2, node.retreat);
			let ii = mymap.get(key);
			if (ii == undefined) {
				node2 = new naval_unit_graph_node(naval_group.um, s2, node.retreat, naval_group.is_nonaval);
				node2.dlast = true;
				mymap.set(key, node2);
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
			let key = make_node_key(s2, node.retreat);
			let ii = mymap.get(key);
			if (ii == undefined) {
				node2 = new naval_unit_graph_node(naval_group.um, s2, node.retreat, naval_group.is_nonaval);
				node2.dlast = true;
				mymap.set(key, node2);
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
			let key = make_node_key(s2, node.retreat);
			let ii = mymap.get(key);
			if (ii == undefined) {
				node2 = new naval_unit_graph_node(naval_group.um, s2, node.retreat, naval_group.is_nonaval);
				node2.dlast = true;
				mymap.set(key, node2);
				myheap.push(node2);
				//console.log (node2, "push 5");
				//console.log (node2.index, "push 5");
			} else {
				node2 = ii;
			}
			node.next_dlast_subhit = node2;
		}
		if (naval_group.submerge_sub && node.num_subs > 0 && node.retreat.length == 0) {
			let [s2, num_submerge, subs] = retreat_subs(naval_group.um, node.unit_str);
			let node2 : naval_unit_graph_node;
			let key = make_node_key(s2, subs);
			let ii = mymap.get(key);
			if (ii == undefined) {
				node2 = new naval_unit_graph_node(naval_group.um, s2, subs, naval_group.is_nonaval);
				if (node2.num_naval > 0) {
					node2.dlast = node.dlast;
				} else {
					node2.dlast = false;
				}
				mymap.set(key, node2);
				myheap.push(node2);
				//console.log (node2, "push 6");
				//console.log (node2.index, "push 6");
			} else {
				node2 = ii;
			}
			node.next_submerge = node2;
		}
		if (is_amphibious && node.unit_str.length > 0 && node.retreat.length == 0) {
			let [s2, amphibious] = retreat_non_amphibious(naval_group.um, node.unit_str);
			if (true || hasAmphibious (naval_group.um, s2)) {
				let node2 : naval_unit_graph_node;
				let key = make_node_key(s2, amphibious);
				let ii = mymap.get(key);
				if (ii == undefined) {
					node2 = new naval_unit_graph_node(naval_group.um, s2, amphibious, naval_group.is_nonaval);
					if (node2.num_naval > 0) {
						node2.dlast = node.dlast;
					} else {
						node2.dlast = false;
					}
					mymap.set(key, node2);
					myheap.push(node2);
					//console.log (node2, "push 6");
					//console.log (node2.index, "push 6");
				} else {
					node2 = ii;
				}
				node.next_retreat_amphibious = node2;
			}
		}
		if (naval_group.is_crash_fighters) {	
			let s2 = crash_fighters(naval_group.um, node.unit_str);
			let node2 : naval_unit_graph_node;
			let key = make_node_key(s2, node.retreat);
			let ii = mymap.get(key);
			if (ii == undefined) {
				node2 = new naval_unit_graph_node(naval_group.um, s2, node.retreat, naval_group.is_nonaval);
				if (node2.num_naval > 0) {
					node2.dlast = node.dlast;
				} else {
					node2.dlast = false;
				}
				mymap.set(key, node2);
				myheap.push(node2);
				//console.log (node2, "push 6");
				//console.log (node2.index, "push 6");
			} else {
				node2 = ii;
			}
			node.next_crash_fighters = node2;
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
        } else {
			let [s2, n2, subs] = retreat_subs(naval_group.um, node.unit_str);
            node.nosub_group = make_unit_group(naval_group.um, s2, naval_group.attdef);
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
		let red_retreat_str = get_reduced_group_string(node.retreat);

		console.log(`${node.index}:  ${red_str}:${red_retreat_str} ${node.num_subs} ${node.num_air} ${node.num_naval} ${node.num_dest} ${node.dlast} ${node.cost}`);
//		if (node.next_subhit != undefined && node.next_airhit != undefined && node.next_navalhit != undefined){
//			console.log(node.index, node.next_subhit.index, node.next_airhit.index, node.next_navalhit.index);
//		}
		if (node.next_crash_fighters != undefined) {
			console.log(node.index, node.next_crash_fighters.index);
		}
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

    let numArt = count_units(input, 'a') + count_units(input, 'g');
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
		if (ch == 'j') {
			if (cnt < numArt) {
				let newout;
				if (i > 0) {
					newout = out.substring(0, i) + 'h' + 	
								out.substring(i+1, out.length);
				} else {
					newout = 'h' + 	out.substring(1, out.length);
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

function preparse(isnaval : boolean, input : string, attdef : number, skipAA : boolean = false) : string
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


export interface aacalc_input {
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
	attacker_retreat : string;
	defender_retreat : string;
	attacker_casualty : string;
	defender_casualty : string;	
	prob : number;
}

interface casualty_1d {
	remain : string;
	retreat : string;
	casualty : string;
	prob : number;
}


export interface aacalc_output {
	attack : aacalc_info;
	defense : aacalc_info;
	casualtiesInfo : casualty_2d[]
	att_cas : casualty_1d[]
	def_cas : casualty_1d[]
	rounds : number;
	takesTerritory : number[]
}

export function aacalc(
		input : aacalc_input
		) 
   : aacalc_output
{
	let um = new unit_manager();

	let attackers_internal = preparse(input.is_naval, input.attacker, 0);
	let defenders_internal = preparse(input.is_naval, input.defender, 1, input.is_in_progress);
	console.log(attackers_internal, "attackers_internal");
	console.log(defenders_internal, "defenders_internal");
	
	if (!input.is_naval) {
		console.time('init');
		let myprob = new problem(um, attackers_internal, defenders_internal, 1.0);
		myprob.retreat_threshold = input.retreat_threshold;
		myprob.set_prune_threshold(input.prune_threshold, input.prune_threshold / 10, input.report_prune_threshold);
		console.timeEnd('init');

		let numAA = count_units(myprob.def_data.unit_str, 'c');
		let doAA = 
				numAA > 0 && 
				hasNonAAUnit(myprob.um, myprob.def_data.unit_str);
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
			input.att_destroyer_last, input.att_submerge_sub, input.def_destroyer_last, input.def_submerge_sub, 
			-1 /* rounds */, input.retreat_threshold, false );
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
export function apply_ool(input : string, ool : string, aalast : boolean = false)  : string {
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
	if (aalast && out.length > 2) {
		// move aa's to the second to last
		for (let i = 0; i < out.length; i++) {
			let ch = out.charAt(i);
			if ((ch == "c") || (ch == "e")) {
				out = out.substr(0, 1) + ch + out.substr(1, i-1) + out.substr(i+1);
			}
		}
	}
	return out;
}



export interface wave_input {
	attacker : string;
	defender : string;
	def_ool : string;
	def_aalast : boolean;
	att_submerge : boolean;
	def_submerge : boolean;
	att_dest_last : boolean;
	def_dest_last : boolean;
	is_crash_fighters : boolean;
	retreat_threshold : number;
	rounds : number;
}


export interface multiwave_input {
	wave_info : wave_input[];
	debug	: boolean;
	prune_threshold : number;
	report_prune_threshold : number;
	is_naval : boolean;
	in_progress : boolean;
	num_runs	: number;
}

export interface multiwave_output {
	out : aacalc_output;
	output : aacalc_output[]
}


function collect_and_print_results(
	problem : naval_problem) 
{
	let problemArr : naval_problem[];
	problemArr = [];
	problemArr.push(problem);
	let result_data : result_data_t[];
	result_data = [];
	collect_naval_results(problem, problemArr, 0, result_data);
	let skipMerge = problem.is_retreat;
	console.log (skipMerge, "skipMerge");
	let out = print_naval_results(problem, problemArr, result_data, !skipMerge);
	console.log(out);
}

export function multiwave(
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

	for (let runs = 0 ; runs < input.num_runs; runs++) {

	for (let i = 0; i < input.wave_info.length; i++) {
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
				let newcasstr = apply_ool(cas.remain + def_token, wave.def_ool, wave.def_aalast);
			
				// TODO... should submerged subs fight in the second wave... probably true
				let newcasualty : casualty_1d = { remain : newcasstr, retreat: "", casualty : cas.casualty, prob : p1}
				defend_add_reinforce.push(newcasualty);
				if (p2 > 0) {
					let newcasstr = apply_ool(cas.remain, wave.def_ool, wave.def_aalast);
					let newcasualty : casualty_1d = { remain : newcasstr, retreat : "", casualty : cas.casualty, prob : p2}
					//defend_add_reinforce.push(newcasualty);
				}
			}
			let defender = apply_ool(defend_add_reinforce[defend_add_reinforce.length-1].remain + 
						defend_add_reinforce[defend_add_reinforce.length-1].casualty, wave.def_ool, wave.def_aalast);
			defenders_internal = preparse(input.is_naval, defender, 1);

		} else {
			let defenders_token = preparse_token(wave.defender, 1);
			let defenders_ool = apply_ool(defenders_token, wave.def_ool, wave.def_aalast);
			let skipAA = input.in_progress;
			defenders_internal = preparse(input.is_naval, defenders_ool, 1, skipAA);
		}
		let attackers_internal = preparse(input.is_naval, wave.attacker, 0);

		console.log(defend_add_reinforce, "defend_add_reinforce");
		probArr.push(new naval_problem(um, attackers_internal, defenders_internal, 1.0, 
			wave.att_dest_last, wave.att_submerge, wave.def_dest_last, wave.def_submerge, 	
			wave.rounds, wave.retreat_threshold, wave.is_crash_fighters, input.is_naval,
			defend_add_reinforce));
		let myprob = probArr[i];
		myprob.set_prune_threshold(input.prune_threshold, input.prune_threshold / 10, input.report_prune_threshold);
		let problemArr : naval_problem[];
		problemArr = [];
		problemArr.push(myprob);
		//console.log(myprob);
		solve_sub( myprob, 0);

		let result_data : result_data_t[];
		result_data = [];
		collect_naval_results(myprob, problemArr, 0, result_data);
		let skipMerge = myprob.is_retreat;
		console.log (skipMerge, "skipMerge");
		let out = print_naval_results(myprob, problemArr, result_data, !skipMerge);
		output.push(out);
		console.log(out, "wave", i);
	}

    }

	let attsurvive : number[] = [];
	let defsurvive : number[] = [];
	let attipc : number[] = [];
	let defipc : number[] = [];
	let atttakes : number[] = [];
	for (let i = 0; i < input.wave_info.length; i++) {
		let att_survives = output[i].attack.survives[0]
		let def_survives = output[i].defense.survives[0]
		let att_ipcLoss = output[i].attack.ipcLoss[0]
		let def_ipcLoss = output[i].defense.ipcLoss[0]
		let att_takes = output[i].takesTerritory[0]
		if (i > 0) {
			for (let j = 0 ; j < i; j++) {
				def_ipcLoss += (output[j].takesTerritory[0] * get_cost_from_str(probArr[j].um, probArr[j].def_data.unit_str, ""));
			}
			//def_ipcLoss -= defipc[i-1];
			att_ipcLoss += attipc[i-1];
			att_survives += atttakes[i-1];
			att_takes += atttakes[i-1];
		}
		attsurvive.push(att_survives);
		defsurvive.push(def_survives);
		attipc.push(att_ipcLoss);
		defipc.push(def_ipcLoss);
		atttakes.push(att_takes);
	}
	let att_cas : casualty_1d[];

	let out2 : aacalc_output = {
		attack : { survives : attsurvive, ipcLoss : attipc },
		defense : { survives : defsurvive, ipcLoss : defipc },
		casualtiesInfo : [],
		att_cas : [],
		def_cas : [],
		rounds : -1,
		takesTerritory : atttakes
	}

	let out : multiwave_output = { 
		out: out2,
		output : output };
	return out;

}

