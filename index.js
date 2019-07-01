var app = new Vue({
  el: '#root',
  data: {
    all_tabs: [{
      key: 'all',
      name: 'Result summary'
    }, {
      key: 'individual',
      name: 'Group result'
    }],
    tab: 1,
    all_results: [],
    selected_player: null
  },
  computed: {
    result_summary_header: function () {
      let max_game_num = this.all_results.reduce((acc,x) => {
        let game_num = x.games.length;
        if (game_num > acc) acc = game_num;
        return acc
      }, 0);
      let h = [...Array(max_game_num).keys()].map(x => ({ text: `Game ${x+1}`, value: `${x}`, align: 'center' }));
      h.splice(0,0,{ text: 'Player', value: 'player' });
      h.splice(0,0,{ text: 'Icon', value: 'icon' });
      h.push({ text: 'Total', value: 'total', align: 'center' });
      return h;
    },
    result_summary_items: function () {
      return this.all_results.map(x => ({
        name: x.name,
        icon: x.icon,
        games: [...Array(this.result_summary_header.length-2).keys()].map(i => x.games[i] ? this.getPoints(x.games[i].rolled[x.games[i].rolled.length - 1]) : 0)
      }));
    },
    current_player: function () {
      let c_ai = this.all_results.find(x => x.name == this.selected_player);
      return c_ai ? c_ai : { name: null, module: null, icon: '', members: [], games: [] }
    },
  },
  mounted: function () {
    this.loadResults().then(console.log).then(r => {
      this.selected_player = this.all_results[0] ? this.all_results[0].name : null;
    });
  },
  methods: {
    loadResults: function () {
      let req = new Request("./results.json");
      return fetch(req)
        .then(r => {
          if (r.status == 200) return r.json();
          else throw new Error("Error loading game result")
        })
        .then(r => {
          this.all_results = r;
          return r
        });
    },
    getPoints: function (dice_face) {
      console.log(dice_face);
      let points = dice_face ? dice_face.reduce((acc, v) => acc + v, 0) : 0;
      if (points !== 0) {
        let freq = Array(6);
        freq.fill(0);
        dice_face.forEach(x => {
          freq[x-1] += 1;
        });
        if (freq.indexOf(5) !== -1) { points += 70; } //five in a row
        else if (freq.indexOf(4) !== -1) { points += 40; } //four + one
        else if (freq.indexOf(3) !== -1) { points += (freq.indexOf(2) !== -1) ? 50 : 30; } //three + two or three + one + one
        else {
          let sorted_df = dice_face.slice(0);
          sorted_df.sort();
          if (sorted_df.reduce((acc,val,idx,arr) => { if (idx > 0) { acc.push(val - arr[idx-1]); } return acc; }, []).every(el => el == 1)) { points += 60; } // straights
        }
      }
      return points;
    },
  }
});