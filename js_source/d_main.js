(function(){
	var scope = gci2016;
	var dom = scope.dom;

	var dotplots = d3.selectAll("div.dotplot");

	//signature for map setup: function(container, map_width, register_resize, render_as_canvas)
	//notes set a max width : 
	var width_fn = function(){return gci2016.getdim(gci2016.dom.wrapn, 1600).width}
	var sm_width_fn = function(){
		try{
			var box = this.getBoundingClientRect();
			var w = Math.floor(box.right - box.left);
		}
		catch(e){
			var w = 400;
		}
		return w;
	}

	var bigmap = gci2016.map.setup(gci2016.dom.mapwrap.node(), width_fn, true, true)
	bigmap.voro = true;

	d3.json(scope.repo + "data.json", function(error, dat){
		if(error){
			return null;
		}
		gci2016.data = dat;

		var data_vars = [];
		for(var v in dat.meta.vars){
			if(dat.meta.vars.hasOwnProperty(v) && dat.meta.vars[v].cat !== "id"){
				data_vars.push(dat.meta.vars[v]);
			}
		}
		data_vars.sort(function(a,b){
			var ai = (a.varid.replace(/V| */,""));
			var bi = (b.varid.replace(/V| */,""));
			return ai-bi;
		});

		gci2016.data_vars = data_vars;

		if(gci2016.map.geojson){initialDraw()}
	});

	d3.json(gci2016.repo + "world.json", function(error, dat){
		if(error){
			return null;
		}
		gci2016.map.geojson = topojson.feature(dat, dat.objects.countries);
		
		if(gci2016.data){initialDraw()}
	});

	function initialDraw(){
		var text = gci2016.data.meta.clusters;

		bigmap.draw("V5").tooltip().addTable();

		dotplots.each(function(d,i){
			var thiz = d3.select(this);

			var group = thiz.append("div").classed("c-fix cluster-group-description",true);

			var title = group.append("p").classed("cluster-title",true);
				title.insert("div").style("background-color", gci2016.cols[text[i].cluster]);
				title.insert("span").text(text[i].name).style("vertical-align","middle");
				
			var map = group.append("div").classed("right-col small-map",true);
			var mapObject = gci2016.map.setup(map.node(), sm_width_fn, true, true).draw(4, text[i].cluster);

			var description = group.selectAll("p.reading").data([text[i].description]);
				description.enter().append("p").classed("reading",true)
											   .classed("zero-top-margin", function(d,i){return i==0})
											   .text(function(d,i){return d})
												;

			thiz.append("p").text(text[i].name + " by the numbers").style("margin","20px 0px 0px 3%").style("font-weight","bold").style("font-size","1em");
			thiz.append("p").text("Average group performance on indicators that describe the position of metro areas in the global economy. [need language]").style("margin","0.5em 0px 30px 3%");

			var plot = thiz.append("div");

			scope.scroll.register(plot.node(), scope.dotPlot.call(plot.node(), text[i].cluster, gci2016.data), function(c){});
			scope.scroll.register(map.node(), mapObject.filter);
		});
	}	

	function scroll(){
		var bbox = dom.fixedframewrap.node().getBoundingClientRect();
		if(bbox.top <= 80){
			dom.fixedframe.style("position","fixed").style("top","80px").style("display","block");
			d3.select("#dummy-banner").style("display","block").style("top","0px").style("left","0px"); //remove for production
		}
		else{
			dom.fixedframe.style("position","relative").style("top","0px").style("display","none");
			d3.select("#dummy-banner").style("display","none"); //remove for production
		}
	}

	//window.addEventListener("resize", resizer);

	window.addEventListener("scroll", scope.scroll.activateListeners);
	window.addEventListener("scroll", scroll);

})();