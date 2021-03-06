//global namespace for interactive
gci2016 = {};

//directory containing app assets -- need to change to "directory/on/wordpress";
gci2016.repo = "./";

//hold dom references/methods
gci2016.dom = {};
gci2016.dom.wrap = d3.select("#gci2016wrap");
gci2016.dom.wrapn = gci2016.dom.wrap.node();
gci2016.dom.fixedframewrap = d3.select("#gci2016fixedframewrap");
gci2016.dom.fixedframe = d3.select("#gci2016fixedframe");
gci2016.dom.mapwrap = d3.select("#gci2016mapwrap");

//colors for each cluster 1-7 
gci2016.cols = ['#cccccc','#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f'];

//register arbitrary scroll events
gci2016.scroll = {}
gci2016.scroll.count = 0;
gci2016.scroll.listeners = {};

gci2016.scroll.register = function(element, onview, onscroll){
	var getBox = function(){
		try{
			var box = element.getBoundingClientRect();
		}
		catch(e){
			var box = null;
		}
		return box;
	}

	var id = "event" + (++gci2016.scroll.count);
	
	gci2016.scroll.listeners[id] = {
		viewed:false,
		viewing:false,
		get_box:getBox,
		onview: onview,
		onscroll: onscroll
	}

	gci2016.scroll.activateListeners(); //in case one is in view from the outset

}

//activate must be called as a method of gci2016.scroll
gci2016.scroll.activate = function(id, window_height){
	if(this.listeners.hasOwnProperty(id)){
		var listener = this.listeners[id];

		var box = listener.get_box();

		if(box===null){
			listener.viewed = true;
			listener.viewing = false;
			listener.onview();
		}
		else{
			listener.viewing = box.top-window_height < 0 && box.top > 0;

			var top = box.top;
			var bottom = box.bottom;
			var middle = top + ((bottom-top)/2)

			var middleOffset = middle-window_height;

			if(!listener.viewed && middleOffset < 0 && middle > 100){
				listener.viewed = true;
				listener.onview();
				//delete this.listeners[id]; //remove to lower cost of scroll event
			}

			if(listener.viewing && listener.onscroll){listener.onscroll(top/window_height)}
		}
	}
	}

//what if innerHeight isn't supported? -- activate all?
gci2016.scroll.activateListeners = function(){
	//run in the next tick to allow redraws to happen
	setTimeout(function(){
		var h = window.innerHeight;
		for(var id in gci2016.scroll.listeners){
			gci2016.scroll.activate(id, h);
		}
	},0);
		
}

//get element width, height, in pixels
//in future, ensure this is run in next tick of event loop using setTimeout(0) and native promises, if supported
gci2016.getdim = function(el, maxwidth, maxheight){
	if(arguments.length > 0){
		var element = el;
	}
	else{
		var element = document.documentElement;
	}

	var floor = 50;
	var err = false;

	try{
		var box = element.getBoundingClientRect();
		var w = Math.floor(box.right - box.left);
		var h = Math.floor(box.bottom - box.top);
		if(w < floor || h < floor){throw "badWidth"}
	}
	catch(e){
		var box = {};
		var w = floor;
		var h = floor;
		err = true;
	}

	if(!!maxwidth && w > maxwidth){w = maxwidth}
	if(!!maxheight && h > maxheight){h = maxheight}

	var dim = {width:w, height:h, error:err, box:box};

	return dim;
}

//place tooltip relative to container; 
//xbuffer is how far left or right the tooltip is from the targetXY (mouse/touch position)
//fbr is the fixed banner height (or vertical distance at the top of the viewport that should be considered off limits)
gci2016.placetip = function(tip_node, container_node, xbuffer, fbr){
	
	//default to showing tooltip on right, don't flip orientations unless forced
	var tipRight = true;
	var pad = !!xbuffer ? xbuffer : 35;
	fbr = !!fbr ? fbr : 85;

	try{
		if(tip_node.style.width == ""){
			tip_node.style.width = "320px";
		};
	}
	catch(e){
		//no-op
	}

	var xy = function(target_xy){
		var tipdim = gci2016.getdim(tip_node);
		var contdim = gci2016.getdim(container_node);

		var mouseX = target_xy[0];
		var mouseY = target_xy[1];

		var errorX = false;

		try{
			var wdiff = contdim.width - tipdim.width;
			if(wdiff > 0 && wdiff < pad){
				pad = wdiff;
			}
			else if(wdiff < 0){
				pad = 0;
			}

			if(tipRight){
				if((mouseX + tipdim.width + pad) > contdim.width){
					tipRight = false;
					var newX = mouseX - tipdim.width - pad;
				}
				else{
					var newX = mouseX + pad;
				}
			}
			else{
				if((mouseX - tipdim.width - pad) < 0){
					tipRight = true;
					var newX = mouseX + pad;
				}
				else{
					var newX = mouseX - tipdim.width - pad;
				}
			}

			if((newX + tipdim.width) >= contdim.width || newX < 0){throw "tooWide"}
		}
		catch(e){
			var newX = 0;
			errorX = true;
		}

		//y pos
		try{
			if(errorX){throw "badX"}

			var viewport = {};
			viewport.w = Math.max(document.documentElement.clientWidth, (window.innerWidth || 0));
			viewport.h = Math.max(document.documentElement.clientHeight, (window.innerHeight || 0));

			var hdiff = viewport.h - tipdim.height - fbr;
			
			var quarterh = Math.round(tipdim.height/4);
			if(hdiff > quarterh){
				var ypad = quarterh;
			}
			else if(hdiff >= 0){
				var ypad = hdiff;
			}
			else{
				var ypad = 0;
			}

			//console.log("container top: " +  contdim.box.top + " | mouse-y: " + mouseY + " | tip height: " + tipdim.height + " | ypad: " +ypad);
			//remember: mouseY is relative to the top of container 

			//condition 1: tooltip is taller than viewport or it would extend into fbr

			if(tipdim.height+fbr >= viewport.h || contdim.box.top + mouseY - ypad <= fbr){
				var newY = fbr-contdim.box.top;
			}
			else if((contdim.box.top + mouseY + tipdim.height - ypad) > viewport.h){
				var newY = viewport.h - contdim.box.top - tipdim.height;
			}
			else{
				var newY = mouseY - ypad;
			}
		}
		catch(e){
			var newY = mouseY + 15;
		}

		return [newX, newY];
	}

	return xy;
}
