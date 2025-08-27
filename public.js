var url = "https://api.complib.org/";
var rowarr = [];
var arr2 = [];
var stage;
var numbells;
var tenor;
var goodrows = [];
var index = [];
var courseorders = [];
var what;
var leadlength;
var methodinfo = {};
var compinfo;
const places = "1234567890ET";
var rowcategories = ["top","queens","tittums","queensish","tittumsish","allthirds", "exploded tittums", "exploded steps", "exploded thirds", "roundspairs", "thirds and steps", "tittums down a stage", "queens down a stage", "run", "step sequence", "nice zigzag"];
var maxes = [
  {
    stage: 6
  },
  {
    stage: 8
  },
  {
    stage: 10
  },
  {
    stage: 12,
    top: 82,
    tittums: 128,
    roundspairs: 46038,
    allthirds: 46080
  }
];
var tonictriad = [
  {stage: 8, bells: [1,4,6,8]},
  {stage: 10, bells: [1,3,6,8,10]},
  {stage: 12, bells: [1,3,5,8,10,12]}
];
var tritone = {
  stage8: [2,5],
  stage10: [4,7],
  stage12: [2,6,9]
};





$(function() {
  //comparecloserows(8);
  let calls = rowtorow("87123456", "12345678"); //12345678 87654321
  //console.log(calls.length, rowtorow("87123456", "17645328").length);
  //rowtorow("78123456", "82354671").length
  //console.log($('input[name="complibwhat"]:checked').val());
  //getloop(6);
  $("#submit").on("click", subcomplib);
  //$("table").on("click", ".catrow", function(e) {
  //  $(e.currentTarget).next().toggle();
  //});
  
  $("#courseorders").on("click", "td", courseclick);
  $("#searchbutton").on("click", handlesearchbar);
  
});


//active 2024-12-28
function subcomplib() {
  $("tbody").contents().detach();
  $("h3").detach();
  $("#container").contents().detach();
  $("#rowcolumn,#catcolumn").contents().detach();
  methodinfo = {};
  leadlength = null;
  if (!$("#summary").hasClass("hidden")) {
    $("#summary").addClass("hidden");
  }
  let num = $("#complibid").val();
  if (num.length > 4 && /^\d+$/.test(num)) {
    tenor = $("#addtenor").prop("checked");
    what = $('input[name="complibwhat"]:checked').val();
    console.log(what);
    getcomplib(num, ["composition","compexperiment"].includes(what) ? "composition" : "method");
  }
}

//active 2024-12-28
function getcomplib(compid, w) {
  var xhr = new XMLHttpRequest();
  
  xhr.open('GET', url+w+"/"+compid+"/rows", true);
  xhr.send();
  
  xhr.onload = function() {
    let results = JSON.parse(xhr.responseText);
    rowarr = [];
    if (results.rows) {
      
      stage = results.stage;
      console.log("stage",stage);
      numbells = tenor ? stage+1 : stage;
      $("#container").append(`<h3>${results.title}</h3>`);
      for (let i = 2; i < results.rows.length; i++) {
        let row = results.rows[i][0].split("").map(bellnum);
        if (tenor) row.push(stage+1);
        rowarr.push(row);
        if (!leadlength && results.rows[i][2] === "16") {
          leadlength = i-1;
          //console.log(leadlength);
        }
      }
      console.log(rowarr.length);
      if (what === "experiment") {
        
        experiment();
      } else if (what === "compexperiment") {
        let xxhr = new XMLHttpRequest();
        xxhr.open('GET', url+w+"/"+compid, true);
        xxhr.send();
        xxhr.onload = function() {
          compinfo = JSON.parse(xxhr.responseText);
          compexperiment();
        }
        
      } else {
        analyze(true, rowarr);
      }
      
      if (stage === numbells && stage%2 === 0) {
        //sortrows();
      } else if (stage%2 === 1) {
        //testsort();
      }
      
    }
  }
}

//drawing a rhombicosidodecahedron so I can map major coursing orders on it
function compexperiment() {
  if (compinfo.methodDefinitions.length > 1) {
    console.log("spliced");
  } else if (stage === 8) {
    let ll = compinfo.methodDefinitions[0].placeNotationLength;
    let cos = {};
    let numcos = 0;
    if (compinfo.startRowIndex === 0 && compinfo.backstrokeStart === false) {
      cos["753246"] = 1;
      numcos = 1;
    }
    for (let i = ll-1; i < rowarr.length; i+=ll) {
      let row = rowarr[i];
      let co = getcofromlh(row);
      let costr = rowstring(co);
      if (cos[costr]) {
        cos[costr]++;
      } else {
        cos[costr] = 1;
        numcos++;
      }
    }
    console.log(numcos);
    console.log(cos);
    let pentagons = {};
    let numpents = 0;
    for (let co in cos) {
      if (co[0] === "7") {
        let a = co.slice(1).split("").map(bellnum);
        let rot = rotateco2(a,5);
        let str = rowstring(rot);
        if (pentagons[str]) {
          if (!pentagons[str].includes(co)) {
            pentagons[str].push(co);
          }
        } else {
          pentagons[str] = [co];
          numpents++;
        }
      }
    }
    console.log(numpents);
    console.log(pentagons);
  }
  
  $('#svgcontainer').svg({onLoad: drawInitial});
}

//in the method search?
function courseclick(e) {
  if ($(e.currentTarget).hasClass("selected")) {
    $(e.currentTarget).removeClass("selected");
    $("#courseorders td.close").removeClass("close");
    $("#courseorders td.false").removeClass("false");
    $("div#courseinfo").contents().detach();
  } else {
    $("div#courseinfo").contents().detach();
    ["selected","close","false","hasrow"].forEach(w => {
      $("#courseorders td."+w).removeClass(w);
    });
    $(e.currentTarget).addClass("selected");
    //console.log($(e.currentTarget).find("li:first-child").text());
    let costr = $(e.currentTarget).find("li:first-child").text();
    let close = closecourses(costr);
    //console.log(close);
    close.forEach(s => {
      if ($("td#c"+s)) {
        $("td#c"+s).addClass("close");
      }
    });
    let fcos = getfalse(costr);
    fcos.forEach(s => {
      if ($("td#c"+s)) {
        $("td#c"+s).addClass("false");
      }
    });
    let details = methodinfo.cos[costr];
    let html = `<ul>
    `;
    for (let i = 0; i < details.wholerows.length; i++) {
      html += `<li>${details.wholerows[i]}</li>
      `;
    }
    html += `</ul>`;
    $("#courseinfo").append(html);
  }
}


// ***** BELLRINGING FUNCTIONS *****

//convert bell characters to numbers
function bellnum(n) {
  return places.indexOf(n)+1;
}

//convert array of bell numbers to string of characters
function rowstring(arr) {
  let r = arr.map(n => places[n-1]);
  return r.join("");
}

//lh as array
function getcofromlh(lh) {
  let home = homecourseorder(lh.length);
  home.unshift(lh.length);
  let co = [];
  for (let i = 0; i < home.length; i++) {
    co.push(lh[home[i]-1]);
  }
  let rot = rotateco(co, lh.length);
  
  return rot;
}

//rotate a coursing order to put the tenor first, and remove the tenor
function rotateco(co,n) {
  let i = co.indexOf(n);
  let rot = co.slice(i+1);
  if (i > 0) {
    rot.push(...co.slice(0,i));
  }
  return rot;
}

//rotate a coursing order to put a given number first
//co needs to be an array of numbers
function rotateco2(co,n) {
  let i = co.indexOf(n);
  let rot = co.slice(i);
  if (i > 0) {
    rot.push(...co.slice(0,i));
  }
  return rot;
}

//row needs to be array of numbers
function findcofromrow(row) {
  let trebleplace = row.indexOf(1);
  let plainrows = rowarr.filter((r,i) => {
    return i < leadlength && r[trebleplace] === 1;
  });
  let home = homecourseorder(stage);
  home.unshift(stage);
  let cos = [];
  for (let i = 0; i < plainrows.length; i++) {
    let order = [];
    for (let j = 0; j < home.length; j++) {
      order.push(plainrows[i].indexOf(home[j]));
    }
    let co = [];
    for (let j = 0; j < order.length; j++) {
      co.push(row[order[j]]);
    }
    let rot = rotateco(co,stage);
    cos.push(rowstring(rot));
  }
  return cos;
}



//extremely unfinished
function buildtop(n) {
  let good = {};
  let bigrounds = places.slice(0,n);
  good[bigrounds] = "top";
  let bigback = bigrounds.split("").reverse().join("");
  good[bigback] = "top";
  
  for (let extra = 1; extra <= n/2; extra++) {
    let stage = n-extra;
    
  }
  
}

//active Dec 2024
function experiment() {
  if ([6,8].includes(stage)) {
    $.get("courseorder"+stage+".json", function(body) {
      courseorders = body;
      console.log(body.length);
      $("#searchbar").removeClass("hidden");
      
      let fcourses = findfalse();
      methodinfo.fcourses = fcourses;
      //console.log(fcourses.length);
      fcourses.forEach(o => {
        
        $("#container").append(`<p>${o.co}: </p>`);
        o.leads.forEach(l => {
          let html = `<p class="tab">leadhead ${l.lh}: ${l.rownums}</p>`;
          $("#container").append(html);
        });
        
        
      });
      courseanalyze();
      //haven't implemented the next bit
      let html = `<ul>
      `;
      ["run","thirds","arpeggio","sequence","exploding"].forEach(w => {
        html += `<li><label for="display${w}"><input type="radio" id="display${w}" name="displayfeature" value="${w}" /> ${w}</label></li>`;
      });
      html += `</ul>`;
      //$("#displayoptions").append(html);
      
    });
  } else {
    $("#container").append(`<p>Can't deal with this method yet</p>`);
  }
}

function handlesearchbar(e) {
  ["selected","close","false"].forEach(w => {
    $("#courseorders td."+w).removeClass(w);
  });
  $("td.hasrow").removeClass("hasrow");
  $("div#courseinfo").contents().detach();
  $("#searchbar p").detach();
  let text = $("#search").val();
  
  let patterns = handlepatterns(text);
  if (patterns.length === 0) {
    $("#searchbar").append(`<p>invalid search string</p>`);
  } else {
    let rows = [];
    patterns.forEach(p => {
      let rr = getrowsfrompattern(p);
      rows.push(...rr);
    });
        
    //console.log(rows);
    let acos = [];
    let count = 0;
    
    for (let i = 0; i < rows.length; i++) {
      let cos = findcofromrow(rows[i]);
      //console.log(cos);
      
      let found;
      for (let j = 0; j < cos.length; j++) {
        if ($("#c"+cos[j]).length) {
          found = true;
          let obj = acos.find(o => o.co === cos[j]);
          if (obj) {
            obj.count++;
          } else {
            acos.push({co: cos[j], count: 1});
          }
        }
      }
      if (found) count++;
    }
    if (acos.length === 0) {
      $("#searchbar").append(`<p>row not available</p>`);
    }
    acos.forEach(o => {
      $("#c"+o.co).addClass("hasrow");
    });
    
  }
  
}

function handlepatterns(pattern) {
  let chars = 0;
  let openparens = [];
  let closeparens = [];
  let inside;
  let xinside;
  let badchar;
  for (let i = 0; i < pattern.length; i++) {
    let c = pattern[i];
    switch (c) {
      case "(":
        inside = true;
        openparens.push(i);
        break;
      case ")":
        inside = false;
        closeparens.push(i);
        break;
      case "x":
        if (inside) xinside = true;
        chars++;
        break;
      default:
        if (places.slice(0,stage).includes(c)) {
          chars++;
        } else {
          badchar = true;
        }
    }
    
  }
  if (openparens.length != closeparens.length || !closeparens.every((n,i) => n > openparens[i]) || chars != stage || xinside || badchar) {
    //bad input
    return [];
  } else {
    let current = [pattern];
    let next = [];
    for (let i = openparens.length-1; i > -1; i--) {
      for (let j = 0; j < current.length; j++) {
        let pp = expandgroup(current[j], openparens[i], closeparens[i]);
        next.push(...pp);
      }
      current = next;
      next = [];
    }

    //console.log(current);
    return current;
  }
  
}

function expandgroup(pattern, start, end) {
  let patterns = [];
  let chunk = [];
  for (let j = start+1; j < end; j++) {
    chunk.push(bellnum(pattern[j]));
  }
  let ext = buildextent(chunk);
  ext.forEach(a => {
    let p = pattern.slice(0,start) + rowstring(a) + pattern.slice(end+1);
    patterns.push(p);
  });
  return patterns;
}

//pattern has the form of a row where some characters are specific bells and others are "x";
function getrowsfrompattern(pattern) {
  let rows = [];
  let v = [];
  let rounds = places.slice(0,pattern.length);
  for (let i = 0; i < rounds.length; i++) {
    if (!pattern.includes(rounds[i])) {
      v.push(bellnum(rounds[i]));
    }
  }
  if (v.length) {
    let extent = buildextent(v);
  
    for (let i = 0; i < extent.length; i++) {
      let row = [];
      let sub = extent[i];
      let k = 0;
      for (let j = 0; j < pattern.length; j++) {
        let c = pattern[j];
        if (c === "x") {
          row.push(sub[k]);
          k++;
        } else {
          row.push(bellnum(c));
        }
      }
      rows.push(row);
    }
  } else {
    rows.push(pattern.split("").map(bellnum));
  }
  
  return rows;
}

function buildextent(r) {
  let n = r.length;
  let arr = [];
  if (n === 2) {
    return extenttwo(r);
  } else if (n < 13) {
    for (let i = 0; i < n; i++) {
      let others = [];
      for (let j = 0; j < n; j++) {
        if (j != i) others.push(r[j]);
      }
      
      let ends = buildextent(others);
      ends.forEach(a => {
        a.unshift(r[i]);
        arr.push(a);
      });
    }
  }
  return arr;
}

function extenttwo(r) {
  let arr = [r,[r[1],r[0]]];
  return arr;
}



//given a coursing order, find the courses that are false against it
function getfalse(co) {
  let fcos = [];
  let home = homecourseorder(stage);
  methodinfo.fcourses.forEach(o => {
    let str = "";
    for (let i = 0; i < co.length; i++) {
      let n = o.co[i];
      let j = home.indexOf(n);
      str += co[j];
    }
    fcos.push(str);
  });
  return fcos;
}

//co does not include tenor
function closecourses(co) {
  let close = [];
  
  for (let i = 0; i <= co.length; i++) {
    let t = "";
    switch (i) {
      case co.length:
        //tenor makes the bob
        t = co.slice(2) + co.slice(0,2);
        break;
      case co.length-1:
        t = co[0] + co[co.length-1] + co.slice(1, -1);
        break;
      case co.length-2:
        t = co[co.length-2] + co.slice(0, -2) + co[co.length-1];
        break;
      default:
        t = co.slice(0,i) + co[i+1] + co[i+2] + co[i] + co.slice(i+3);
    }
    close.push(t);
  }
  return close;
}

function courseanalyze() {
  let cos = stage === 6 ? courseorders : courseorders.filter(o => o.incourse === true && o.tentogether === true);
  cos[0].catcounts = analyze(false, rowarr);
  let ranges = {
    totalmin: cos[0].catcounts.total,
    totalmax: cos[0].catcounts.total,
    fullmin: cos[0].catcounts.fullrows,
    fullmax: cos[0].catcounts.fullrows
  };
  let cosindex = {};
  cosindex[rowstring(cos[0].co)] = cos[0].catcounts;
  for (let i = 1; i < cos.length; i++) {
    let co = cos[i].co;
    let course = buildcourse(co);
    cos[i].catcounts = analyze(false, course);
    cosindex[rowstring(co)] = cos[i].catcounts;
    for (let key in ranges) {
      let n = key.includes("total") ? cos[i].catcounts.total : cos[i].catcounts.fullrows;
      if (key.includes("min")) {
        ranges[key] = Math.min(ranges[key], n);
      } else {
        ranges[key] = Math.max(ranges[key], n);
      }
    }
  }
  console.log(ranges);
  methodinfo.cos = cosindex;
  displaycourses(cos, ranges);
}

function displaycourses(cos, ranges) {
  let html = "";
  let increments = {
    wtotal: 68/(ranges.totalmax-ranges.totalmin-1),
    btotal: 45/(ranges.totalmax-ranges.totalmin-1),
    wfull: 68/(ranges.fullmax-ranges.fullmin-1),
    bfull: 45/(ranges.fullmax-ranges.fullmin-1)
  };
  for (let i = 0; i < cos.length; i++) {
    let o = cos[i];
    let co = rowstring(o.co);
    if (i%6 === 0) {
      html += `<tr>`;
    }
    let nums = {
      wtotal: 15 + (ranges.totalmax-o.catcounts.total)*increments.wtotal,
      btotal: 52 - (ranges.totalmax-o.catcounts.total)*increments.btotal,
      wfull: 15 + (ranges.fullmax-o.catcounts.fullrows)*increments.wfull,
      bfull: 52 - (ranges.fullmax-o.catcounts.fullrows)*increments.bfull
    };
    
    html += `<td id="c${co}"><ul>
    <li>${co}</li>
    <li style="background-color: hwb(91 ${nums.wtotal}% ${nums.btotal}%)">${o.catcounts.total} rows</li>
    <li style="background-color: hwb(91 ${nums.wfull}% ${nums.bfull}%)">${o.catcounts.fullrows} full rows</li>
    <li>${o.catcounts.run} run</li>
    <li>${o.catcounts.thirds} thirds</li>
    <li>${o.catcounts.sequence} sequences</li>
    <li>${o.catcounts.exploding} exploding</li>
    </ul></td>`;
    if (i%6 === 5) {
      html += "</tr>";
      $("#courseorders").append(html);
      html = "";
    }
  }
  $("#courseorders").removeClass("hidden");
}

function findfalse() {
  //for each course order
  //build the course
  //comparecourse(course)
  let cos = stage === 6 ? courseorders : courseorders.filter(o => o.incourse === true && o.tentogether === true);
  cos.shift();
  console.log("number of course orders to check: "+cos.length);
  let fcourses = [];
  for (let i = 0; i < cos.length; i++) {
    let co = cos[i].co;
    let course = buildcourse(co);
    if (i === 0) {
      //console.log(course);
    }
    let f = comparecourse(course);
    if (f.length) {
      let leads = [];
      for (let j = 1; j < stage; j++) {
        let rows = [];
        let lh = j === 1 ? course[course.length-1] : course[j*leadlength-1];
        f.forEach(a => {
          let n = a[1];
          if (n < j*leadlength && n > (j-1)*leadlength-1) {
            rows.push(n-(j-1)*leadlength+1);
          }
        });
        if (rows.length) {
          leads.push({lh: rowstring(lh), rownums: rows});
        }
      }
      fcourses.push({co: co, rownums: f, leads: leads});
    }
  }
  return fcourses;
  
}

//does not include tenor
function homecourseorder(stage) {
  let home = [];
  for (let b = 2; b < stage; b+=2) {
    home.push(b);
    home.unshift(b+1);
  }
  return home;
}

//co should be an array
function buildcourse(co) {
  let home = homecourseorder(stage);
  let course = [];
  for (let i = 0; i < rowarr.length; i++) {
    let old = rowarr[i];
    let row = [];
    for (let p = 0; p < stage; p++) {
      if ([1,stage].includes(old[p])) {
        row.push(old[p])
      } else {
        let b = old[p];
        let j = home.indexOf(b);
        row.push(co[j]);
      }
    }
    course.push(row);
  }
  return course;
}

function comparecourse(course) {
  let dex = {};
  for (let i = 0; i < rowarr.length; i++) {
    let str = rowstring(rowarr[i]);
    dex[str] = i+1;
  }
  let dice = [];
  for (let i = 0; i < course.length; i++) {
    let str = rowstring(course[i]);
    let n = dex[str];
    if (n) {
      dice.push([n-1, i]);
    }
  }
  return dice;
}

function drawInitial(svg) {
  svg.configure({xmlns: "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", width: 1000, height: 1000});
  
  let length = 50;
  let group = svg.group("lines", {fill: "none", stroke: "black", "stroke-width": 1});
  let startpoint = [500-length/2, 500];
  let initial = [" h", length, "v", length, "h", length*-1, "v", -length];
  svg.path(group, "M "+startpoint.join(" ")+initial.join(" "));
  let x = length * Math.sin(18*Math.PI/180);
  let y = length * Math.cos(18*Math.PI/180);
  svg.path(group, "M "+startpoint[0]+" 500 l -"+x+" -"+y);
  svg.path(group, "M "+(500+length/2)+" 500 l "+x+" -"+y);
  svg.path(group, "M "+startpoint[0]+" "+(500+length)+" l -"+x+" "+y);
  svg.path(group, "M "+(500+length/2)+" "+(500+length)+" l "+x+" "+y);
  let diffy = length/2 * Math.tan(54*Math.PI/180) + length/2 / Math.cos(54*Math.PI/180);
  let starty = 500 - diffy;
  svg.line(group, 500, starty, 500-length/2-x, 500-y);
  svg.line(group, 500, starty, 500+length/2+x, 500-y);
  starty = 500 + length + diffy;
  svg.line(group, 500, starty, 500-length/2-x, 500+length+y);
  svg.line(group, 500, starty, 500+length/2+x, 500+length+y);
  
  svg.line(group, startpoint[0], 500, startpoint[0]-y, 500+x);
  svg.line(group, startpoint[0]-x, 500-y, startpoint[0]-x-y, 500-y+x);
  svg.line(group, startpoint[0]-y, 500+x, startpoint[0]-x-y, 500-y+x);
  let startx = 500+length/2;
  svg.line(group, startx, 500, startx+y, 500+x);
  svg.line(group, startx+x, 500-y, startx+x+y, 500-y+x);
  svg.line(group, startx+y, 500+x, startx+x+y, 500-y+x);
  
  svg.path(group, "M "+(startpoint[0]-x-y) + " " + (500-y+x) + " h -"+length);
  svg.line(group, startpoint[0]-x-y-length, 500-y+x, startpoint[0]-x-y-length-x, 500+x);
  
  svg.path(group, "M "+(startx+x+y) + " " + (500-y+x) + " h "+length);
  svg.line(group, startx+x+y+length, 500-y+x, startx+x+y+length+x, 500+x);
}

function calculateend(x,y,h,angle) {
  
}

function comparecloserows(n) {
  let roundsclose = buildcloserows(places.slice(0,n));
  let namedrows = buildnamedrows(n);
  let queens = namedrows.find(o => o.name === "queens");
  let q = rowstring(queens.row);
  let qclose = buildcloserows(q);
  let count = 0;
  for (let key in qclose) {
    if (roundsclose[key]) {
      console.log(key, roundsclose[key], qclose[key]);
      count++;
    }
  }
  console.log("rows close to both queens and rounds: "+count);
}

function buildcloserows(start) {
  let dex = {};
  dex[start] = 0.5;
  let current = [start];
  let next = [];
  let count = 1;
  let steps = 1;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < current.length; j++) {
      let row = current[j];
      for (let p = 0; p < start.length-1; p++) {
        let nrow = row.slice(0,p) + row[p+1] + row[p] + row.slice(p+2);
        if (!dex[nrow]) {
          dex[nrow] = steps;
          next.push(nrow);
        }
      }
      
    }
    count += next.length;
    current = next;
    next = [];
    steps++;
  }
  return dex;
}

function buildnamedrows(n) {
  let rows = [
    {name: "rounds", row: places.slice(0,n).split("").map(bellnum)},
    {name: "backrounds", row: places.slice(0,n).split("").reverse().map(bellnum)}
  ];
  let kings = [];
  for (let i = 1; i < n; i+=2) {
    kings.push(i+1);
    kings.unshift(i);
  }
  let queens = kings.slice(0,n/2).reverse().concat(kings.slice(n/2));
  rows.push({name: "queens", row: queens}, {name: "kings", row: kings});
  let tittums = [];
  for (let i = 1; i <= n/2; i++) {
    tittums.push(i, i+n/2);
  }
  rows.push({name: "tittums", row: tittums});
  let stittums = rowstring(tittums);
  let squeens = rowstring(queens);
  rows.push({name: "reverse tittums", row: stittums.split("").reverse().map(bellnum)});
  rows.push({name: "reverse queens", row: squeens.split("").reverse().map(bellnum)});
  return rows;
}

//r1 and r2 are strings
function rowtorow(r1, r2) {
  let calls = []; //these will actually be pairs of places that need to swap
  let before = 0;
  let current = r1;
  for (let p = 0; p < r2.length; p++) {
    
    let b = r2[p];
    let i = r1.indexOf(b);
    if (p > 0) {
      let prev = r2[p-1];
      if (r1.indexOf(prev) > i) {
        before++;
      }
    }
    let k = current.indexOf(b)
    for (let j = current.indexOf(b); j > p; j--) {
      calls.push([j,j+1]);
    }
    let next = current.split("");
    next.splice(k,1);
    next.splice(p, 0, b);
    current = next.join("");
  }
  return calls;
}

function checkgood(row) {
  let n = row.length;
  
  let diffabs = [];
  let normalpairs = [];
  let oddabs = [];
  let normoddabs = [];
  let result;
  let lesser = [];
  let tonicbells = tonictriad.find(o => o.stage === numbells);
  
  
  let normalr = [];
  let bells = [];
  let max = Math.max(...row);
  for (let i = 1; i <= max; i++) {
    if (row.includes(i)) {
      bells.push(i);
    }
  }
  for (let i = 0; i < n; i++) {
    let b = row[i];
    let j = bells.indexOf(b)+1;
    normalr.push(j);
  }
  
  for (let i = 1; i < n; i++) {
    let d = Math.abs(row[i]-row[i-1]);
    diffabs.push(d);
    if (![1,2,7,9].includes(d)) {
      lesser.push({i: i-1, bells: [row[i-1],row[i]], abs: d});
    }
    if (i%2 === 1) {
      row[i] > row[i-1] ? normalpairs.push(row[i-1], row[i]) : normalpairs.push(row[i], row[i-1]);
      oddabs.push(d);
      normoddabs.push(Math.abs(normalr[i]-normalr[i-1]));
    }
  }
  
  let explodey = true;
  let k = 2;
  while (explodey && k < n) {
    explodey = normalpairs[k] < normalpairs[k-2] && normalpairs[k+1] > normalpairs[k-1];
    if (n === 4 && explodey) {
      explodey = diffabs[k] === diffabs[k-2]+2;
    }
    k+=2;
  }
  
  let tittums = normoddabs[0] != 1;
  k = 2;
  let dir = normalpairs[2] > normalpairs[0] ? 1 : -1;
  while (tittums && k < n) {
    tittums = dir === 1 ? normalpairs[k] > normalpairs[k-2] && normalpairs[k+1] > normalpairs[k-1] : normalpairs[k] < normalpairs[k-2] && normalpairs[k+1] < normalpairs[k-1];
    if (n === 4 && tittums) {
      tittums = Math.abs(normalpairs[k]-normalpairs[k-2]) === 1;
    }
    k+=2;
  }
  
  if (explodey) {
    result = "exploding";
  } else if (oddabs.every(e => e === oddabs[0])) {
    switch (oddabs[0]) {
      case 1:
        result = "steps";
        break;
      case 2:
        result = "thirds";
        break;
      default:
        if (tittums) {
          result = "tittums";
        }
    }
  } else if (diffabs.filter(e => e === 1).length > Math.max(n-4,1)) {
    result = "mostly steps";
  } else if (oddabs.every(e => [1,2,7,9].includes(e))) {
    result = "steps, thirds, and/or octaves";
  } else if (diffabs.filter(e => ![1,2].includes(e)).length === 1) {
    result = "mostly steps & thirds";
  } else if (diffabs.filter(e => ![1,2,7,9].includes(e)).length === 1) {
    result = "mostly steps, thirds, and/or octaves";
  } else if (n > 4 && max > n && tittums && normoddabs.every(e => e === normoddabs[0])) {
    result = "tittums??";
  } else if (n === 4 && max > n && tittums && oddabs.every(e => e === oddabs[0])) {
    result = "tittums??";
  } else if (lesser.every(o => o.bells.every(e => tonicbells.bells.includes(e)))) {
    result = "good intervals";
  } else if (lesser.length < 3 && lesser.every(o => ![6,8].includes(o.abs))) {
    result = "mostly good intervals";
  }
  
  return result;
}

function analyzewholepull(hand, back) {
  let n = hand.length;
  let trit = tritone["stage"+numbells];
  let tonicbells = tonictriad.find(o => o.stage === numbells);
  let badback;
  if (back[n-2] === n && back[n-1] === n-1) {
    badback = true;
  } else if ([back[n-2],back[n-1]].every(e => trit.includes(e))) {
    badback = true;
  }
  let res = {};
  let rows = {
    hand: hand,
    back: back,
    wrap: hand.slice(n/2).concat(back.slice(0,n/2))
  };
  
  
  ["hand", "back"].forEach(w => { //, "wrap"
    if (!badback || w != "back") {
      let units = [];
      let allunits = [];
      let extraunits = [];
      let prev;
      for (let i = 1; i < numbells; i++) {
        let chunk = [rows[w][i-1],rows[w][i]]
        let d = Math.abs(rows[w][i]-rows[w][i-1]);
        if ([1,2,7,9].includes(d) || chunk.every(e => tonicbells.bells.includes(e))) {
          [i-1,i].forEach(n => {
            allunits.push(n);
            if (!units.includes(n)) units.push(n);
          });
          
        }
        
        let pi;
        let pd;
        let ti;
        let td;
        let steps = {};
        if (i > 1 && d != 1) {
          if (rows[w][i] > 1) {
            steps.above = rows[w].indexOf(rows[w][i]-1);
          }
          if (rows[w][i] < stage) {
            steps.below = rows[w].indexOf(rows[w][i]+1);
          }
          if (steps.above < i) {
            let chunk = rows[w].slice(steps.above+1, i);
            pd = chunk.length < 3 && (chunk.every(e => e < rows[w][i]-1) || chunk.every(e => e > rows[w][i]));
            pi = steps.above;
          }
          if (steps.below < i) {
            let chunk = rows[w].slice(steps.below+1, i);
            td = chunk.length < 3 && (chunk.every(e => e > rows[w][i]-1) || chunk.every(e => e < rows[w][i]));
            ti = steps.below;
          }
        }
        if (pd) {
          extraunits.push(pi,i);
        }
        if (td) {
          extraunits.push(ti,i);
        }
        
      }
      for (let i = 1; i <= stage; i++) {
        if (!units.includes(i) && extraunits.includes(i)) {
          units.push(i);
          allunits.push(0,i);
        }
      }
      res[w+"units"] = units.length;
      let whole = checkgood(rows[w]);
      if (whole) {
        res[w] = [{whole: true, cat: whole}];
      } else {
        let next = [];
        let count = 0;
        for (let i = 0; i < 3; i++) {
          let r = checkgood(rows[w].slice(i,i+n-2));
          if (r) count++;
          next.push(r);
        }
        if (count > 0) {
          res[w] = [{whole: true, cat: "something"}];
        } else {
          let half = rows[w].slice(0,n/2);
          let half2 = rows[w].slice(n/2);
          let g = checkgood(half);
          let g2 = checkgood(half2);
          if (g && g2) {
            res[w] = [{halfhalf: true, cat: g+"; "+g2}];
          }
        }
      }
    }
    
    
  });
  return res;
}

function analyzerow(row) {
  let wholerow;
  let categories = [];
  let tonicbells = tonictriad.find(o => o.stage === numbells);
  let tonicii = [];
  
  let normalpairs = [];
  for (let i = 1; i < row.length; i+=2) {
    row[i] > row[i-1] ? normalpairs.push(row[i-1], row[i]) : normalpairs.push(row[i], row[i-1]);
    for (let j = i-1; j <= i; j++) {
      if (tonicbells.bells.includes(row[j])) {
        tonicii.push(j);
      }
    }
    
  }
  
  let namedrows = buildnamedrows(numbells);
  
  
  
  let diffs = [];
  let absdiffs = [];
  let odddiffs = [];
  let oddabs = [];
  let normoddabs = [];
  let evendiffs = [];
  for (let j = 1; j < row.length; j++) {
    let d = row[j]-row[j-1];
    diffs.push(d);
    absdiffs.push(Math.abs(d));
    if (j%2 === 1) {
      odddiffs.push(d);
      oddabs.push(Math.abs(d));
      normoddabs.push(Math.abs(normalpairs[j]-normalpairs[j-1]));
    } else {
      evendiffs.push(d);
    }
  }
  
  let explodey = true;
  let k = 1;
  while (explodey && k < oddabs.length) {
    explodey = normoddabs[k] === normoddabs[k-1]+1;
    k++;
  }
  
  let halfhalf = true;
  k = Math.ceil(diffs.length/2);
  while (halfhalf && k < diffs.length) {
    halfhalf = diffs[k] === diffs[k-stage/2];
    k++;
  }
  
  let tonictogether = true;
  k = 1;
  while (tonictogether && k < tonicii.length) {
    tonictogether = tonicii[k] === tonicii[k-1]+1;
    k++;
  }
  if (tonictogether) {
    //console.log("tonictogether");
    //console.log(rowstring(row));
  }
  
  let diffreps = [];
  for (let i = 0; i < diffs.length; i++) {
    let d = diffs[i];
    let count = 1;
    let j = i+1;
    while (j < diffs.length && diffs[j] === d) {
      count++;
      j++;
    }
    diffreps.push(count);
  }
  
  if (diffs.every(e => e === diffs[0])) {
    wholerow = true;
    categories.push("run");
  } else if (diffs.filter(e => [1,-1].includes(e)).length > stage-4) {
    wholerow = true;
    let one = diffs.filter(e => e === 1).length;
    let minus = diffs.filter(e => e === -1).length;
    let ii = [];
    diffs.forEach((n,i) => {
      if (![1,-1].includes(n)) {
        ii.push(i);
      }
    });
    if (ii.length === 2 && (one+3 === stage || minus+3 === stage) && ii[1] === ii[0]+1) {
      categories.push("interrupted run");
    } else if (ii.length === 1) {
      if ([0,stage-2].includes(ii[0])) {
        categories.push("run");
      } else {
        categories.push("runs");
      }
    } else {
      categories.push("mostly steps");
    }
    
  } else if (oddabs.every(e => e === oddabs[0])) {
    wholerow = true;
    let d = Math.abs(odddiffs[0]);
    switch (d) {
      case 1:
        categories.push("step sequence");
        break;
      case 2:
        categories.push("thirds");
        break;
      case stage/2:
        categories.push("tittums");
        break;
      default:
        categories.push("sequence");
    }
  } else if (oddabs.every(e => [1,2].includes(e))) {
    wholerow = true;
    categories.push("steps and thirds");
  } else if (oddabs.every(e => [1,7].includes(e))) {
    wholerow = true;
    categories.push("steps and octaves");
  } else if (oddabs.every(e => [1,2,7,9].includes(e))) {
    wholerow = true;
    categories.push("steps, thirds, octaves, tenths");
  } else if (absdiffs.every(e => [1,stage/2].includes(e))) {
    wholerow = true;
    categories.push("tittums");
  } else if (evendiffs.every(e => [1,-1].includes(e))) {
    wholerow = true;
    categories.push("mostly steps?");
  } else if (explodey) {
    wholerow = true;
    categories.push("exploded tittums");
  } else if ((odddiffs.every(e => e > 0) && evendiffs.every(e => e < 0)) || (odddiffs.every(e => e < 0) && evendiffs.every(e => e > 0))) {
    let odds = [];
    let evens = [];
    let odddir;
    let evendir;
    let oddrun = true;
    let evenrun = true;
    for (let i = 1; i < row.length; i+=2) {
      odds.push(row[i-1]);
      evens.push(row[i]);
      let j = odds.length-1;
      if (i === 3) {
        odddir = odds[1]-odds[0] > 0 ? 1 : -1;
        evendir = evens[1]-evens[0] > 0 ? 1 : -1;
      }
      if (i > 3) {
        let odir = odds[j]-odds[j-1] > 0 ? 1 : -1;
        let edir = evens[j]-evens[j-1] > 0 ? 1 : -1;
        if (oddrun) {
          oddrun = odir === odddir;
        }
        if (evenrun) {
          evenrun = edir === evendir;
        }
        
      }
    }
    if (oddrun && evenrun) {
      wholerow = true;
      categories.push("nice zigzag");
    }
  } else if (Math.max(...diffreps) >= stage/2) {
    console.log("half row");
    console.log(rowstring(row));
  }
  
  let closeto = [];
  namedrows.forEach(o => {
    let distance = rowtorow(rowstring(o.row), rowstring(row));
    if (distance.length < stage/2+1) {
      closeto.push(o.name);
    }
  });
  if (closeto.length) {
    //console.log("close to "+closeto.join(", "), wholerow);
    //console.log(rowstring(row));
  }
  
  
  return {wholerow: wholerow, categories: categories, halfhalf: halfhalf};
}

function analyze2(display, rarr) {
  //can I identify dominant followed by tonic??? like, 27 *followed* by 1 is nice
  let rowhtml = [];
  let cathtml = [];
  let counts = {
    hand: 0,
    back: 0,
    wrap: 0
  };
  let catcounts = [{cat: "halfhalf", count: 0}];
  let tonicbells = tonictriad.find(o => o.stage === numbells);
  let sevenunits = 0;
  
  for (let i = 1; i < rarr.length; i+=2) {
    
    let res = analyzewholepull(rarr[i-1], rarr[i]);
    if (res.handunits === 7) {
      sevenunits++;
    }
    if (res.backunits === 7) {
      sevenunits++;
    }
    let h = `<li`;
    let cat = `<li>`+res.handunits+` units</li>
    <li>`+res.backunits+` units</li>
    `;
    if (res.hand) {
      if (res.hand[0].whole) {
        h += ` class="highlightgreen"`;
        //cat += `>`+res.hand[0].cat+`</li><li`;
        let cato = catcounts.find(o => o.cat === res.hand[0].cat);
        if (cato) {
          cato.count++;
        } else {
          catcounts.push({cat: res.hand[0].cat, count: 1});
        }
      } else {
        catcounts[0].count++;
        h += ` class="highlightpurple"`;
        //cat += `>`+res.hand[0].cat+`</li><li`;
      }
      
      counts.hand++;
      
    } else {
      //cat += ` class="fade">tbd</li><li`;
    }
    h += `>`+rowstring(rarr[i-1])+`</li>`;
    rowhtml.push(h);
    let b = `<li`;
    if (res.back) {
      if (res.back[0].whole) {
        b += ` class="highlightblue"`;
        //cat += `>`+res.back[0].cat+`</li>`;
        let cato = catcounts.find(o => o.cat === res.back[0].cat);
        if (cato) {
          cato.count++;
        } else {
          catcounts.push({cat: res.back[0].cat, count: 1});
        }
      } else {
        catcounts[0].count++;
        b += ` class="highlightpurple"`;
        //cat += `>`+res.back[0].cat+`</li><li`;
      }
      
      counts.back++;
      
    } else {
      //cat += ` class="fade">tbd</li>`;
    }
    b += `>`+rowstring(rarr[i])+`</li>`;
    rowhtml.push(b);
    
    if (!res.wrap) {
      //cat += ` class="fade">tbd</li>`;
    } else {
      //cat += `>wrap</li>`;
      counts.wrap++;
    }
    
    cathtml.push(cat);
  }
  console.log(counts);
  console.log(catcounts);
  console.log("seven units: "+sevenunits);
  if (display) {
    displayanalysis(rowhtml, cathtml);
  }
}

//active 2024-12-28
function analyze(display, rowarr) {
  
  let runcount = 0;
  let seqcount = 0;
  let seqfcount = 0;
  let both = 0;
  let total = 0;
  let fullrows = 0;
  let extracount = 0;
  let badback = 0;
  let catcounts = {
    run: 0,
    sequence: 0,
    thirds: 0,
    tonic: 0,
    arpeggio: 0,
    exploding: 0,
    two: [],
    more: [],
    wholerows: []
  };
  let rowhtml = [];
  let cathtml = [];
  let trit = tritone["stage"+numbells];
  let namedrows = buildnamedrows(numbells);
  let closetonamed = 0;
  let extraorclose = 0;
  let tonicbells = tonictriad.find(o => o.stage === numbells);
  for (let i = 0; i < rowarr.length; i++) {
    let row = rowarr[i];
    
    
    let versions = [row];
    if (tenor) {
      versions.push(row.slice(0,-1));
    }
    
    if (i%2 === 1) {
      if (row[row.length-2] === stage && row[row.length-1] === stage-1) {
        badback++;
      } else if (trit && row.slice(row.length-2).every(b => trit.includes(b))) {
        badback++;
      }
    }
    
    let extrafull;
    if (what === "method") {
      let o = analyzerow(row);
      if (o.wholerow) {
        extracount++;
        extrafull = o.categories[0];
        //console.log(rowstring(row));
        //console.log(extrafull);
      } 
      if (o.halfhalf) {
        //console.log(rowstring(row));
        //console.log("halfhalf");
      }
    }
    
    let closeto = [];
    let mindist = 28;
    let mindistrow;
    namedrows.forEach(o => {
      let distance = rowtorow(rowstring(o.row), rowstring(row));
      if (distance.length < mindist) mindistrow = o.name;
      mindist = Math.min(distance.length, mindist);
      if (distance.length < stage/2+1) {
        closeto.push(o.name);
      }
    });
    if (closeto.length) {
      closetonamed++;
      extraorclose++;
      //console.log("close to "+closeto.join(", "), extrafull);
      //console.log(rowstring(row));
    } else if (extrafull) {
      extraorclose++;
      //console.log("min distance to named row: "+mindist, extrafull);
      //console.log(rowstring(row));
    } else if (mindist <= 10) {
      //console.log("distance to "+mindistrow+": "+mindist);
      //console.log(rowstring(row));
    }
    
    
    let diffs = [];
    let odddiffs = [];
    let goodpairs = [];
    for (let j = 1; j < row.length; j++) {
      diffs.push(row[j]-row[j-1]);
      if (j%2 === 1) {
        let d = Math.abs(row[j]-row[j-1]);
        odddiffs.push(row[j]-row[j-1]);
        let pair = [row[j-1], row[j]];
        goodpairs.push([1,2,7,9].includes(d) || (tonicbells && pair.every(b => tonicbells.bells.includes(b))));
      }
    }
    
    let thirds = [];
    let thirdsp = [];
    let arpp = hasarpeggio(row, diffs);
    let tonic = numbells > 8 ? hastonic(row) : [];
    for (let k = arpp.length-1; k > -1; k--) {
      if (arpp[k].every(n => tonic.includes(n-1))) {
        arpp.splice(k,1);
      }
    }
    let runsp = [];
    let runs = [];
    for (let j = 0; j < diffs.length-1; j++) {
      let count = immediaterep(row, diffs, j, [1,-1]);
      let thirdcount = immediaterep(row, diffs, j, [2,-2]);
      if (count > 2) {
        runs.push([j+1, count]);
        let run = [];
        for (let k = 0; k < count; k++) {
          run.push(j+1+k);
        }
        runsp.push(run);
      }
      if (thirdcount > 2) {
        let ps = [];
        //
        //console.log(rowstring(row));
        for (let k = 0; k < thirdcount; k++) {
          ps.push(j+1+k);
        }
        if (!arpp.find(arp => ps.every(p => arp.includes(p))) && !ps.every(p => tonic.includes(p-1))) {
          thirds.push([j+1, thirdcount]);
          thirdsp.push(ps);
        }
        
      }
    }
    if (tonic.length && thirdsp.length) {
      //console.log("tonic thirds "+i);
      //console.log(rowstring(row));
      let find = thirdsp.find(a => tonic.every(n => a.includes(n+1)));
      if (find) {
        tonic = [];
      }
    }
    let alternate = alternating(row);
    let exploding = [];
    if (alternate.explodey.length || alternate.alternate.length) {
      //console.log("has tonic");
      let find = alternate.explodey.find(a => a.length > 5);
      if (find) exploding = find;
      //console.log(rowstring(row));
      //console.log(alternate);
      //console.log(thirdsp);
    }
    
    
    
    
    
    let seq = sequences2(row,diffs);
    let seqf = seq.filter(s => {
      let match = s.pattern.length > 1;
      ["pattern","between","transpose"].forEach(w => {
        if ([1,-1,7,-7].some(n => s[w].includes(n))) {
          match = true;
          if (s[w].includes(7) || s[w].includes(-7)) {
            //console.log(rowstring(row));
            //console.log(s); 
          }
        }
      });
      return match;
    });
    if (seq.length) {
      seqcount++;
    }
    if (seqf.length) {
      seqfcount++;
      
      console.log(rowstring(row));
      console.log(seqf);
    }
    if (rowstring(row) === "24365817") {
      //console.log("tittums");
      //console.log(seq);
      //console.log(seqf);
    }
    if (thirds.length) {
      //runcount++;
      
    }
    if (thirds.length || runs.length || arpp.length || seqf.length || tonic.length || exploding.length) {
      total++;
      
      //console.log(rowstring(row));
      if (seqf.length) {
        //console.log(rowstring(row));
        //console.log(seqf);
      }
      let html = `<li>`;
      let chunks = [];
      let current = [];
      let last = "none";
      let lastcat = "none";
      let dir = 1;
      let descript = [];
      let full = true;
      for (let p = 0; p < numbells; p++) {
        let now;
        let nowcat;
        let run = runsp.findIndex(r => r.includes(p+1));
        let third = thirdsp.findIndex(t => t.includes(p+1));
        let arp = arpp.findIndex(a => a.includes(p+1));
        let sequence = seqf.findIndex(s => s.places.includes(p+1));
        let tonictriad = tonic.includes(p) ? 1 : -1;
        let explode = exploding.includes(p) ? 1 : -1;
        let o = {
          run: run,
          thirds: third,
          arpeggio: arp,
          sequence: sequence,
          tonic: tonictriad,
          exploding: explode
        };
        let numbers = Object.keys(o).map(k => o[k]);
        if (numbers.filter(n => n > -1).length > 2) {
          //console.log("something is wrong! "+i);
          //console.log(rowstring(row));
          now = "highlightpurple";
          nowcat = "three";
        } else if (numbers.filter(n => n > -1).length === 2) {
          now = "highlightpurple";
          nowcat = "two";
        } else if (run > -1 || sequence > -1 || explode > -1) {
          now = "highlightblue";
          nowcat = Object.keys(o).find(k => o[k] > -1);
        } else if (third > -1 || arp > -1 || tonictriad > -1) {
          now = "highlightred";
          nowcat = Object.keys(o).find(k => o[k] > -1);
        } else {
          now = "none";
          nowcat = "none";
          full = false;
        }
        
        ["run","thirds","arpeggio","sequence","tonic","exploding"].forEach(w => {
          if (o[w] > -1 && !descript.includes(w)) {
            descript.push(w);
          }
        });
        
        if (now === last) {
          if (now === "highlightblue") {
            let patternstart = sequence > -1 && seqf[sequence].chunks.find(c => c[0] === row[p]);
            if ((run > -1 && Math.abs(row[p]-row[p-1]) != 1) || (sequence > -1 && patternstart)) {
              chunks.push({chunk: current, cat: dir === 1 ? "highlightblue" : "highlightgreen"});
              dir *= -1;
              current = [];
            } else if (explode > -1) {
              let blue = exploding[0]%2;
              let highlight = (p-1)%2 === blue ? "highlightblue" : "highlightgreen";
              chunks.push({chunk: current, cat: highlight});
              current = [];
            }
          }
          current.push(row[p]);
        } else {
          if (current.length) {
            let cat = last === "highlightblue" ? (dir === 1 ? "highlightblue" : "highlightgreen") : last;
            if (lastcat === "exploding") {
              let blue = exploding[0]%2;
              cat = (p-1)%2 === blue ? "highlightblue" : "highlightgreen";
            }
            chunks.push({chunk: current, cat: cat});
          }
          current = [row[p]];
          dir = 1;
        }
        last = now;
        lastcat = nowcat;
      }
      if (full) {
        fullrows++;
        catcounts.wholerows.push(rowstring(row));
        if (!extrafull) {
          console.log("new function doesn't catch this");
          console.log(rowstring(row));
        }
      } else if (extrafull) {
        
      }
      if (current.length) {
        let cat = last === "highlightblue" ? (dir === 1 ? "highlightblue" : "highlightgreen") : last;
        if (lastcat === "exploding") {
          let blue = exploding[0]%2;
          cat = (numbells-1)%2 === blue ? "highlightblue" : "highlightgreen";
        }
        chunks.push({chunk: current, cat: cat});
      }
      chunks.forEach(c => {
        let span = `<span`;
        
        if (c.cat != "none") {
          span += ` class="${c.cat}"`
        }
        span += `>${rowstring(c.chunk)}</span>`;
        html += span;
      });
      html += `</li>`;
      //$("#rowcolumn").append(html); //
      rowhtml.push(html);
      if (descript.length) {
        if (descript.length === 1) {
          catcounts[descript[0]]++;
        } else if (descript.length === 2) {
          let o = catcounts.two.find(d => d.descript.every(w => descript.includes(w)));
          if (o) {
            o.count++;
          } else {
            o = {
              descript: descript,
              count: 1
            };
            catcounts.two.push(o);
          }
        } else {
          let o = catcounts.more.find(d => d.descript.length === descript.length && d.descript.every(w => descript.includes(w)));
          if (o) {
            o.count++;
          } else {
            o = {
              descript: descript,
              count: 1
            };
            catcounts.more.push(o);
          }
        }
        //total++;
      }
      
      cathtml.push(`<li>${descript.length ? descript.join(", ") : "mystery"} </li>`)
      //$("#catcolumn").append(`<li>${descript.length ? descript.join(", ") : "mystery"} </li>`); //
    } else {
      if (goodpairs.every(d => d)) {
        //console.log(i);
        //console.log("nice intervals");
        //console.log(rowstring(row));
      }
      let html = `<li>${rowstring(row)} </li>`;
      let cat = `<li class="fade">tbd</li>`;
      rowhtml.push(html);
      cathtml.push(cat);
      //$("#rowcolumn").append(html); //
      //$("#catcolumn").append(cat); //
    }
    
    /*
    if (runs.length) {
      runcount++;
      
      let html = `<li>`;
      let chunks = [];
      let p = 1;
      let dir = 1;
      for (let j = 0; j < runs.length; j++) {
        let r = runs[j];
        if (r[0] > p) {
          chunks.push({chunk: row.slice(p-1,r[0]-1)});
        }
        chunks.push({chunk: row.slice(r[0]-1, r[0]+r[1]-1), class: dir === 1 ? "highlightblue" : "highlightgreen"});
        dir *= -1;
        p = r[0]+r[1];
      }
      if (p <= row.length) {
        chunks.push({chunk: row.slice(p-1)});
      }
      chunks.forEach(c => {
        let span = `<span`;
        if (c.class) {
          span += ` class="${c.class}"`
        }
        span += `>${rowstring(c.chunk)}</span>`;
        html += span;
      });
      html += `</li>`;
      $("#rowcolumn").append(html);
      let cat = `<li>one or more runs`;
      if (seqf.length) {
        both++;
        cat+= "; sequence";
      }
      cat += "</li>"
      $("#catcolumn").append(cat);
    } else if (seqf.length) {
      let html = `<li>`;
      let chunks = [];
      let p = 1;
      let dir = 1;
      
      for (let j = 0; j < seqf.length; j++) {
        let o = seqf[j];
        if (o.start >= p) {
          if (o.start > p) {
            chunks.push({chunk: row.slice(p-1,o.start-1)});
          }
          let chunk = [];
          o.chunks.forEach(a => {
            for (let b = 0; b < a.length; b++) {
              chunk.push(a[b]);
            }
          });
          chunks.push({chunk: chunk, class: "highlightred"});
          p = o.start + chunk.length;
        } else if (o.start < p) {
          let end = o.start;
          o.chunks.forEach(c => end+=c.length);
          for (let b = p; b < end; b++) {
            chunks[chunks.length-1].chunk.push(row[b-1]);
          }
          p = end+1;
        }
        
      }
      if (p <= row.length) {
        chunks.push({chunk: row.slice(p-1)});
      }
      chunks.forEach(c => {
        let span = `<span`;
        if (c.class) {
          span += ` class="${c.class}"`
        }
        span += `>${rowstring(c.chunk)}</span>`;
        html += span;
      });
      html += `</li>`;
      $("#rowcolumn").append(html);
      $("#catcolumn").append(`<li>sequence</li>`);
    }
    */
    
  }
  //console.log("bad back: "+badback);
  //console.log("seq rows: "+seqcount);
  //console.log("filter seq rows: "+seqfcount);
  if (what === "method") {
    console.log("whole rows by new function: "+extracount);
    console.log("close to named rows: "+closetonamed);
    console.log("either of above: "+extraorclose);
  }
  //console.log("total: "+total);
  //console.log(catcounts);
  if (display) {
    $("#container").append(`<p>${total} rows with highlighting; ${fullrows} entire rows highlighted.</p>`);
    displayanalysis(rowhtml, cathtml);
    buildsummary(catcounts);
    $("#summary").removeClass("hidden");
  }
  catcounts.total = total;
  catcounts.fullrows = fullrows;
  return catcounts;
}

function displayanalysis(rows, cats) {
  $("#rowcolumn").append(`<li class="fade">${places.slice(0,numbells)}</li>`); //
  $("#catcolumn").append(`<li class="fade">(starting rounds)</li>`); //
  
  rows.forEach(h => {
    $("#rowcolumn").append(h);
  });
  
  cats.forEach(h => {
    $("#catcolumn").append(h);
  });
}

//active 2024-12-28
function buildsummary(catcounts) {
  
  ["run","thirds","arpeggio","sequence","tonic","exploding"].forEach(w => {
    if (w != "tonic" || numbells > 8) {
      $("#summary tbody").append(`<tr><td>${w}</td><td>${catcounts[w]}</td></tr>`);
    }
  });
  ["two", "more"].forEach(w => {
    catcounts[w].forEach(l => {
      $("#summary tbody").append(`<tr><td>${l.descript.join(", ")}</td><td>${l.count}</td></tr>`);
    });
  });
}

//fix the mirroring
function sequences2(row, diffs) {
  let seq = [];
  let remaining = places.slice(0, row.length).split("").map(bellnum);
  
  let patternsize = Math.ceil(diffs.length/2)-1;
  //start with longest possible pattern and make it smaller
  while (patternsize > 0 && remaining.length > 1) { 
    let reps = Math.floor(diffs.length/patternsize);
    //start with most possible repetitions
    while (reps > 1 && remaining.length > 1) { //seq.length === 0 && 
      let length = patternsize*reps+reps-1;
      let leftover = diffs.length-length;
      //starting points for this pattern length and number of reps
      for (let j = 0; j <= leftover; j++) {
        let chunks = [];
        let dchunks = [];
        let negative = [];
        let between = [];
        let transpose = [];
        let pp = [];
        
        for (let i = 0; i < reps; i++) {
          chunks.push(row.slice(j+i*(patternsize+1),j+(i+1)*(patternsize+1)));
          let dchunk = diffs.slice(j+i*(patternsize+1),j+i*(patternsize+1)+patternsize);
          dchunks.push(dchunk);
          if (i === 0) {
            negative = dchunk.map(n => n*-1);
          }
          
          pp.push(j+i*(patternsize+1)+1);
          for (let k = 0; k < dchunk.length; k++) {
            pp.push(j+i*(patternsize+1)+2+k);
          }
          
          if (i < reps-1) {
            transpose.push(row[j+(i+1)*(patternsize+1)]-row[j+i*(patternsize+1)]);
            between.push(diffs[j+i*(patternsize+1)+patternsize]);
          }
          
        }
        if (dchunks.every(a => a.every((e,i) => e === dchunks[0][i]))) {
          let o = {
            pattern: dchunks[0],
            count: reps,
            start: j+1,
            between: between,
            transpose: transpose,
            chunks: chunks,
            places: pp
          }
          //if the sequence is just a run, don't add it
          if (!o.pattern.every(e => [1,-1].includes(e)) || (!o.between.includes(1) && !o.between.includes(-1))) {
            if (seq.length) {
              let add = true;
              let prev = [];
              seq.forEach((ob,j) => {
                let count = 0;
                let addl = [];
                for (let i = 0; i < pp.length; i++) {
                  if (ob.places.includes(pp[i])) {
                    count++;
                  } else {
                    addl.push(pp[i]);
                  }
                }
                let res = null;
                let l = ob.chunks[0].length;
                if (count > l && addl.length > 0) {
                  res = {count: count, patternlength: l, index: j, extrap: addl};
                  if (ob.mirror) res.replace = true;
                  prev.push(res);
                } else if (count > l) {
                  add = false;
                }
                
              });
              
              if (rowstring(row) === "81674523") {
                console.log(prev);
              }
              
              if (prev.length > 1) {
                //I don't know what to do
                console.log("something weird is happening with sequences??");
                console.log(rowstring(row));
              } else if (prev.length === 1) {
                let already = seq[prev[0].index];
                if (prev[0].replace) {
                  seq.splice(prev[0].index, 1);
                  seq.push(o);
                  pp.forEach(p => {
                    let i = remaining.indexOf(p);
                    if (i > -1) {
                      remaining.splice(i,1);
                    }
                  });
                } else {
                  already.incompletepattern = true;
                  let chunk = [];
                  prev[0].extrap.forEach(p => {
                    already.places.push(p);
                    chunk.push(row[p-1]);
                    let i = remaining.indexOf(p);
                    if (i > -1) {
                      remaining.splice(i,1);
                    }
                  });
                  already.chunks.push(chunk);
                }
                
              } else if (add) {
                seq.push(o);
                pp.forEach(p => {
                  let i = remaining.indexOf(p);
                  if (i > -1) {
                    remaining.splice(i,1);
                  }
                });
              }
              
            } else {
              seq.push(o);
              pp.forEach(p => {
                let i = remaining.indexOf(p);
                if (i > -1) {
                  remaining.splice(i,1);
                }
              });
            }
            
          }
          
        } else if (dchunks.every(a => a.every((e,i) => e === dchunks[0][i]) || a.every((e,i) => e === negative[i]))) {
          let o = {
            pattern: dchunks[0],
            count: reps,
            start: j+1,
            between: between,
            transpose: transpose,
            chunks: chunks,
            mirror: true,
            places: pp
          };
          if (seq.length) {
            let find = seq.find(ob => pp.every(p => ob.places.includes(p)));
            if (!find) {
              seq.push(o);
              pp.forEach(p => {
                let i = remaining.indexOf(p);
                if (i > -1) {
                  remaining.splice(i,1);
                }
              });
            }
          } else {
            seq.push(o);
            pp.forEach(p => {
              let i = remaining.indexOf(p);
              if (i > -1) {
                remaining.splice(i,1);
              }
            });
          }
          
        }
        
      }
      
      
      reps--;
    }
    
    
    patternsize--;
  }
  return seq;
}

//active 2024-12-28
function sequences(row, diffs) {
  let seq = [];
  
  let patternsize = Math.ceil(diffs.length/2)-1;
  while (seq.length === 0 && patternsize > 0) {
    let reps = Math.floor(diffs.length/patternsize);
    while (seq.length === 0 && reps > 1) {
      let length = patternsize*reps+reps-1;
      let leftover = diffs.length-length;
      for (let j = 0; j <= leftover; j++) {
        let chunks = [];
        let dchunks = [];
        let absolute = [];
        let between = [];
        let transpose = [];
        let pp = [];
        for (let i = 0; i < reps; i++) {
          chunks.push(row.slice(j+i*(patternsize+1),j+(i+1)*(patternsize+1)));
          let dchunk = diffs.slice(j+i*(patternsize+1),j+i*(patternsize+1)+patternsize);
          dchunks.push(dchunk);
          pp.push(j+i*(patternsize+1)+1);
          let ab = [];
          for (let k = 0; k < dchunk.length; k++) {
            ab.push(Math.abs(dchunk[k]));
            pp.push(j+i*(patternsize+1)+2+k);
          }
          absolute.push(ab);
          
          if (i < reps-1) {
            transpose.push(row[j+(i+1)*(patternsize+1)]-row[j+i*(patternsize+1)]);
            between.push(diffs[j+i*(patternsize+1)+patternsize]);
          }
        }
        if (dchunks.every(a => a.every((e,i) => e === dchunks[0][i]))) {
          let o = {
            pattern: dchunks[0],
            count: reps,
            start: j+1,
            between: between,
            transpose: transpose,
            chunks: chunks,
            places: pp
          }
          //if the sequence is just a run, don't add it
          if (!o.pattern.every(e => [1,-1].includes(e)) || (!o.between.includes(1) && !o.between.includes(-1))) {
            seq.push(o);
          }
          
        } else if (absolute.every(a => a.every((e,i) => e === absolute[0][i])) && absolute[0].every(e => [1,2].includes(e))) {
          let o = {
            pattern: dchunks[0],
            count: reps,
            start: j+1,
            between: between,
            transpose: transpose,
            chunks: chunks,
            mirror: true,
            places: pp
          }
          seq.push(o);
        }
      }
      
      
      reps--;
    }
    
    
    patternsize--;
  }
  return seq;
  
}

//active 2024-12-28
function immediaterep(row, diffs, j, ints) {
  let count = 0;
  if (j === 0 || !ints.includes(diffs[j-1])) {
    if (ints.includes(diffs[j])) {
      count = 2;
      let add = 1;
      let next = j < diffs.length-1 && ints.includes(diffs[j+add]);
      while (next) {
        count++;
        add++;
        next = j < diffs.length-1 && ints.includes(diffs[j+add]);
      }
    }
  }
  return count;
}

//active 2024-12-28
function alternating(row) {
  let odds = [];
  let evens = [];
  for (let i = 1; i < row.length; i+=2) {
    odds.push(row[i-1]);
    evens.push(row[i]);
  }
  let odddiffs = [];
  let evendiffs = [];
  for (let i = 1; i < odds.length; i++) {
    odddiffs.push(odds[i]-odds[i-1]);
    if (evens[i]) {
      evendiffs.push(evens[i]-evens[i-1]);
    }
  }
  let explodey = [];
  let alternate = [];
  
  if (odddiffs.every((d,i) => evendiffs[i] === d*-1)) {
    let pp = [];
    for (let p = 0; p < row.length; p++) {
      pp.push(p);
    }
    explodey.push(pp);
    return {explodey: explodey};
  }
  let oddpp = [];
  let evenpp = [];
  
  for (let j = 0; j < odddiffs.length; j++) {
    let oddcount = immediaterep(odds, odddiffs, j, [1,-1]);
    if (oddcount > 0) {
      let pp = [];
      for (let i = 0; i < oddcount; i++) {
        pp.push(j+i);
      }
      oddpp.push(pp);
    }
    
    if (j < evendiffs.length) {
      let evencount = immediaterep(evens, evendiffs, j, [1,-1]);
      if (evencount > 0) {
        let pp = [];
        for (let i = 0; i < evencount; i++) {
          pp.push(j+i);
        }
        evenpp.push(pp);
      }
    }
  }
  
  let eused = [];
  let oused = [];
  oddpp.forEach((a,ai) => {
    evenpp.forEach((e,i) => {
      let concat = [];
      a.forEach(n => concat.push(n*2));
      e.forEach(n => concat.push(n*2+1));
      concat.sort((b,c) => b-c);
      let diffs = [];
      for (let j = 1; j < concat.length; j++) {
        diffs.push(concat[j]-concat[j-1]);
      }
      let extra = diffs.filter(d => d != 1).length;
      let dstr = diffs.join("");
      let j = dstr.indexOf("111");
      let odir = odds[a[1]]-odds[a[0]];
      let edir = evens[e[1]]-evens[e[0]];
      if (extra < 2 && odir != edir) {
        oused.push(ai);
        eused.push(i);
        explodey.push(concat);
      }
    });
    
    if (a.length > 2 && !oused.includes(ai)) {
      let pp = [];
      a.forEach(n => pp.push(n*2));
      alternate.push(pp);
    }
  });
  
  evenpp.forEach((a,i) => {
    if (!eused.includes(i) && a.length > 2) {
      let pp = [];
      a.forEach(n => pp.push(n*2+1));
      alternate.push(pp);
    }
  });
  return {explodey: explodey, alternate: alternate};
}

//active 2024-12-28
function hastonic(row) {
  let dice = [];
  let result = [];
  let tonic = row.length === 10 ? [1,3,6,8,10] : [1,3,5,8,10,12];
  let ton = row.length === 10 ? [3,10] : [5,12];
  
  for (let i = 0; i < row.length; i++) {
    if (tonic.includes(row[i])) {
      dice.push(i);
    }
  }
  let diffs = [];
  for (let i = 1; i < dice.length; i++) {
    diffs.push(dice[i]-dice[i-1]);
  }
  let str = diffs.join("");
  let i = str.indexOf("111");
  if (i > -1) {
    let count = str.includes("11111") ? 6 : str.includes("1111") ? 5 : 4;
    let triad = dice.slice(i,count+i).map(d => row[d]);
    if (ton.some(b => triad.includes(b))) {
      result = dice.slice(i,count+i);
    }
  }
  
  return result;
}

//active 2024-12-28
//returns array of arrays of row indices
function hasarpeggio(row, diffs) {
  let j = 0;
  let arpp = [];
  while (j < diffs.length-2) {
    if ([3,2].includes(Math.abs(diffs[j]))) {
      let dir = diffs[j] > 0 ? 1 : -1;
      let i = j+1; 
      let arp = [];
      if (diffs[j] === 3*dir && diffs[i] === 2*dir) {
        arp.push(i,i+1,i+2); //row places????
        let seq = [2,2,3];
        let add = patternmatch(diffs, seq, i, dir);
        arp.push(...add);
      } else if (diffs[j] === 2*dir && [2*dir,3*dir].includes(diffs[i])) {
        let seq = diffs[i] === 3*dir ? [3,2,2] : [2,3,2];
        let add = patternmatch(diffs, seq, i, dir);
        if (add.length) {
          arp.push(i, i+1, i+2);
          arp.push(...add);
        }
      }
      if (arp.length > 3) {
        arpp.push(arp);
      }
      if (arp.length) {
        j = arp[arp.length-1]-1;
      } else {
        j++;
      }
      
    } else {
      j++;
    } 
    
  }
  return arpp;
}

//given diffs of a row, a sequence of absolute intervals, an index in diffs where that seq might occur, and a direction
//collect place numbers as long as that interval sequence is repeated
function patternmatch(diffs, seq, i, dir) {
  let arpp = [];
  let add = 1;
  let next = i < diffs.length-1 && diffs[i+add] === seq[add%3]*dir;
  while (next) {
    arpp.push(i+2+add);
    add++;
    next = i+add < diffs.length && diffs[i+add] === seq[add%3]*dir;
  }
  return arpp;
}

function sortrows() {
  let good = goodrows.find(o => o.stage === numbells);
  let dex = index.find(o => o.stage === numbells).index;
  let o = {};
  let max = {};
  let catrows = {};
  rowcategories.forEach(cat => {
    o[cat] = 0;
    catrows[cat] = [];
    max[cat] = good.rows.filter(r => r.category === cat).length;
  });
  for (let i = 0; i < rowarr.length; i++) {
    let str = rowstring(rowarr[i]);
    //console.log(str);
    let j = dex[str];
    //console.log(j);
    if (j >= 0) {
      let r = good.rows[j];
      o[r.category]++;
      catrows[r.category].push(str);
    } else {
      if (filterzigzag(rowarr[i])) {
        o["nice zigzag"]++;
        catrows["nice zigzag"].push(str);
      }
    }
  }
  //console.log(o);
  let total = 0;
  rowcategories.forEach(cat => {
    total += o[cat];
    let html = `<tr class="catrow"><td>${cat}</td><td>${o[cat]}</td><td>${cat === "nice zigzag" ? "" : max[cat]}</td></tr>
    <tr class="rowrow"><td></td><td><ul><li>${catrows[cat].join("</li><li>")}</li></ul></td></tr>`;
    $("tbody").append(html);
    
  });
  
  $("tbody").append(`<tr><td>total</td><td>${total}</td></tr>`);
}

function testsort() {
  let good = goodrows.find(o => o.stage === stage-1);
  let dex = index.find(o => o.stage === stage-1).index;
  let o = {};
  let catrows = {};
  rowcategories.forEach(cat => {
    o[cat] = 0;
    catrows[cat] = [];
  });
  
  for (let i = 0; i < rowarr.length; i++) {
    let row = rowarr[i].slice(0,-1);
    let r = row.filter(b => b != stage);
    let str = rowstring(r);
    let j = dex[str];
    
    if (j >= 0) {
      let g = good.rows[j];
      o[g.category]++;
      catrows[g.category].push(rowstring(row));
    } else {
      if (filterzigzag(row)) {
        o["nice zigzag"]++;
        catrows["nice zigzag"].push(str);
      }
    }
  }
  
  let total = 0;
  rowcategories.forEach(cat => {
    total += o[cat];
    let html = `<tr class="catrow"><td>${cat}</td><td>${o[cat]}</td></tr>
    <tr class="rowrow"><td></td><td><ul><li>${catrows[cat].join("</li><li>")}</li></ul></td></tr>`;
    $("tbody").append(html);
    
  });
  
  $("tbody").append(`<tr><td>total</td><td>${total}</td></tr>`);
}

function sortodd() {
  let o = {};
  let max = {};
  let catrows = {};
  rowcategories.forEach(cat => {
    o[cat] = 0;
    catrows[cat] = [];
  });
  for (let i = 0; i < rowarr.length; i++) {
    let row = rowarr[i].slice(0,-1);
    let its = [];
    let contour = [];
    let dir = row[1] > row[0] ? 1 : -1;
    for (let j = 1; j < row.length; j++) {
      its.push(row[j]-row[j-1]);
      if (j < row.length-1) {
        let d = row[j+1] > row[j] ? 1 : -1;
        contour.push(d === dir ? "x" : "m");
        dir = d;
      }
    }
    if (its.every(j => [1,-1].includes(j)) || contour.filter(c => c === "m").length === 1) {
      catrows.top.push(rowstring(row));
      o.top++;
    }
    
  }
}


function filterzigzag(r) {
  let its = [];
  for (let i = 1; i < r.length; i++) {
    its.push(r[i]-r[i-1]);
  }
  let f = [its[0]];
  let f2 = [];
  for (let i = 1; i < its.length; i+=2) {
    f2.push(its[i]);
    f.push(its[i+1]);
  }
  
  let match;
  
  if ((f.every(n => n < 0) && f2.every(n => n > 0)) || (f.every(n => n > 0) && f2.every(n => n < 0))) {
    let i1 = [];
    let i2 = [];
    for (let i = 2; i < r.length; i+=2) {
      i1.push(r[i]-r[i-2] > 0 ? 1 : -1);
      i2.push(r[i+1]-r[i-1] > 0 ? 1 : -1);
    }
    if (i1.every(n => n === i1[0]) && i2.every(n => n === i2[0])) {
      match = true;
    }
  }
  
  return match;
}

// ****** OLD STUFF ******

//inactive Dec 2024
function getrowsets() {
  
  $.get("rows6.json", function(body) {
    goodrows.push({stage: 6, rows: body});
    $.get("rows8.json", function(arr) {
      goodrows.push({stage: 8, rows: arr});
      console.log(arr.length);
    });
  });
}

//inactive Dec 2024
function getloop(n) {
  $.get("rows"+n+".json", function(body) {
    console.log(body.length);
    goodrows.push({stage: n, rows: body});
    $.get("index"+n+".json", function(obj) {
      index.push({stage: n, index: obj});
      n += 2;
      if (n <= 12) {
        getloop(n);
      } else {
        $("button").removeClass("hidden");
      }
    });
  });
}

