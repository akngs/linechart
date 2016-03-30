import d3 from 'd3';

const SCALE_TYPES = {
  'linear': d3.scale.linear,
  'time': d3.time.scale
};

const linechart = () => {
  let instance = function(containerEl) {
    _init(containerEl);
    _update();
  };

  // Properties
  let data = [];
  instance.data = function(value) {
    return arguments.length ? (data = value, instance) : data;
  };

  let xFocus = null;
  instance.xFocus = function(value) {
    return arguments.length ? (xFocus = value, instance) : xFocus;
  };

  let yFocus = null;
  instance.yFocus = function(value) {
    return arguments.length ? (yFocus = value, instance) : yFocus;
  };

  let pMarkers = [];
  instance.pMarkers = function(value) {
    return arguments.length ? (pMarkers = value, instance) : pMarkers;
  };

  let xMarkers = [];
  instance.xMarkers = function(value) {
    return arguments.length ? (xMarkers = value, instance) : xMarkers;
  };

  let yMarkers = [];
  instance.yMarkers = function(value) {
    return arguments.length ? (yMarkers = value, instance) : yMarkers;
  };

  let xAccessor = (d, i) => i;
  instance.xAccessor = function(value) {
    return arguments.length ? (xAccessor = value, instance) : xAccessor;
  };

  let yAccessor = (d, i) => d;
  instance.yAccessor = function(value) {
    return arguments.length ? (yAccessor = value, instance) : yAccessor;
  };

  let xScaleType = 'linear';
  instance.xScaleType = function(value) {
    return arguments.length ? (xScaleType = value, instance) : xScaleType;
  };

  let yScaleType = 'linear';
  instance.yScaleType = function(value) {
    return arguments.length ? (yScaleType = value, instance) : yScaleType;
  };

  let yAxisTickFormat = null;
  instance.yAxisTickFormat = function(value) {
    return arguments.length ? (yAxisTickFormat = value, instance) : yAxisTickFormat;
  };

  let xAxisTickFormat = null;
  instance.xAxisTickFormat = function(value) {
    return arguments.length ? (xAxisTickFormat = value, instance) : xAxisTickFormat;
  };

  let width = 300;
  instance.width = function(value) {
    return arguments.length ? (width = value, instance) : width;
  };

  let height = 150;
  instance.height = function(value) {
    return arguments.length ? (height = value, instance) : height;
  };

  let marginL = 24;
  instance.marginL = function(value) {
    return arguments.length ? (marginL = value, instance) : marginL;
  };

  let marginR = 18;
  instance.marginR = function(value) {
    return arguments.length ? (marginR = value, instance) : marginR;
  };

  let marginT = 12;
  instance.marginT = function(value) {
    return arguments.length ? (marginT = value, instance) : marginT;
  };

  let marginB = 18;
  instance.marginB = function(value) {
    return arguments.length ? (marginB = value, instance) : marginB;
  };

  let paddingL = 8;
  instance.paddingL = function(value) {
    return arguments.length ? (paddingL = value, instance) : paddingL;
  };

  let paddingB = 8;
  instance.paddingB = function(value) {
    return arguments.length ? (paddingB = value, instance) : paddingB;
  };

  let showDataLine = true;
  instance.showDataLine = function(value) {
    return arguments.length ? (showDataLine = value, instance) : showDataLine;
  };

  let showDataPoint = true;
  instance.showDataPoint = function(value) {
    return arguments.length ? (showDataPoint = value, instance) : showDataPoint;
  };

  // Event handlers
  let mouseoverHandler = (x, y) => {};
  instance.onMouseover = function(value) {
    return (mouseoverHandler = value, instance);
  };

  let mouseoutHandler = () => {};
  instance.onMouseout = function(value) {
    return (mouseoutHandler = value, instance);
  };

  let mousemoveHandler = (x, y) => {};
  instance.onMousemove = function(value) {
    return (mousemoveHandler = value, instance);
  };

  let clickHandler = (x, y) => {};
  instance.onClick = function(value) {
    return (clickHandler = value, instance);
  };

  // Private variables
  let _containerEl;
  let _rootSel;
  let _xAxisSel;
  let _yAxisSel;
  let _plotSel;
  let _pMarkersSel;
  let _xMarkersSel;
  let _yMarkersSel;
  let _xFocusSel;
  let _yFocusSel;
  let _overlaySel;

  let _xScale;
  let _yScale;

  const _init = (containerEl) => {
    _containerEl = containerEl;
    let sel = d3.select(_containerEl);

    // Create root group
    _rootSel = sel.selectAll('.root').data([null]);
    _rootSel.enter().append('g').attr('class', 'root');

    // Create groups for components
    _xAxisSel = _rootSel.selectAll('.axis-x').data([null]);
    _xAxisSel.enter().append('g').attr('class', 'axis axis-x');

    _yAxisSel = _rootSel.selectAll('.axis-y').data([null]);
    _yAxisSel.enter().append('g').attr('class', 'axis axis-y');

    _plotSel = _rootSel.selectAll('.plot').data([null]);
    _plotSel.enter().append('g').attr('class', 'plot');

    _pMarkersSel = _rootSel.selectAll('.markers-p').data([null]);
    _pMarkersSel.enter().append('g').attr('class', 'markers markers-p');

    _xMarkersSel = _rootSel.selectAll('.markers-x').data([null]);
    _xMarkersSel.enter().append('g').attr('class', 'markers markers-x');

    _yMarkersSel = _rootSel.selectAll('.markers-y').data([null]);
    _yMarkersSel.enter().append('g').attr('class', 'markers markers-y');

    _xFocusSel = _rootSel.selectAll('.focus-x').data([null]);
    _xFocusSel.enter().append('line').attr('class', 'focus focus-x');

    _yFocusSel = _rootSel.selectAll('.focus-y').data([null]);
    _yFocusSel.enter().append('line').attr('class', 'focus focus-y');

    _overlaySel = _rootSel.selectAll('.overlay').data([null]);
    _overlaySel.enter().append('rect')
      .attr('class', 'overlay')
      .attr('fill', 'rgba(0, 0, 0, 0)')
      .on('mouseover', _onMouseover)
      .on('mouseout', _onMouseout)
      .on('mousemove', _onMousemove)
      .on('click', _onClick);
  };

  const _update = () => {
    // Update scales
    _xScale = new SCALE_TYPES[xScaleType]()
      .domain(_getExtent(data, xAccessor, xMarkers, pMarkers))
      .rangeRound([0, width - marginL - marginR - paddingL]);
    _yScale = new SCALE_TYPES[yScaleType]()
      .domain(_getExtent(data, yAccessor, yMarkers, pMarkers))
      .rangeRound([height - marginT - marginB - paddingB, 0]);

    let innerWidth = _xScale.range()[1];
    let innerHeight = _yScale.range()[0];
    let color = d3.scale.category10();
    let xScaledAccessor = (d, i) => _xScale(xAccessor(d, i));
    let yScaledAccessor = (d, i) => _yScale(yAccessor(d, i));

    // Resize container element
    _containerEl.setAttribute('width', width);
    _containerEl.setAttribute('height', height);
    _rootSel.attr(
        'transform',
        `translate(${marginL + paddingL}, ${marginT})`);

    // Render axes
    let xAxis = d3.svg.axis()
      .scale(_xScale)
      .tickFormat(xAxisTickFormat)
      .tickSize(2)
      .ticks(5)
      .orient('bottom');
    let yAxis = d3.svg.axis()
      .scale(_yScale)
      .tickFormat(yAxisTickFormat)
      .tickSize(2)
      .ticks(5)
      .orient('left');

    _xAxisSel
      .attr('transform', `translate(0, ${innerHeight + paddingB})`)
      .call(xAxis);
    _yAxisSel
      .attr('transform', `translate(${-paddingL}, 0)`)
      .call(yAxis);

    // Render data lines
    let line = d3.svg.line()
      .x(xScaledAccessor)
      .y(yScaledAccessor);

    let lineSel = _plotSel
      .selectAll('.line')
      .data(showDataLine ? data : [], d => d.key);

    lineSel.enter().append('path')
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke-width', 1);

    lineSel.exit().remove();

    lineSel
      .attr('stroke', (d, i) => color(i))
      .attr('d', d => line(d.values));

    // Render data points
    let pointsSel = _plotSel
      .selectAll('.points')
      .data(showDataPoint ? data : [], d => d.key);

    pointsSel.enter().append('g')
      .attr('class', 'points');

    pointsSel.exit().remove();

    let pointSel = pointsSel.selectAll('.point').data(d => d.values);

    pointSel.enter().append('circle')
      .attr('class', 'point');

    pointSel.exit().remove();

    pointSel
      .attr('cx', xScaledAccessor)
      .attr('cy', yScaledAccessor)
      .attr('r', 2)
      .attr('stroke', (d, i, j) => color(j))
      .attr('stroke-width', 1)
      .attr('fill', 'none');

    // Render point markers
    let pMarkerSel = _pMarkersSel.selectAll('.marker').data(pMarkers);

    pMarkerSel.enter().append('g')
      .attr('class', 'marker')
      .each(function() {
        let sel = d3.select(this);
        sel.append('line')
          .attr('y1', -8)
          .attr('y2', 8)
          .attr('stroke-width', 0.5);
        sel.append('line')
          .attr('x1', -8)
          .attr('x2', 8)
          .attr('stroke-width', 0.5);
      });

    pMarkerSel.exit().remove();

    pMarkerSel
      .attr('transform', d => `translate(${xScaledAccessor(d)}, ${yScaledAccessor(d)})`);

    // Render x focus
    _xFocusSel
      .attr('stroke-width', xFocus === null ? 0 : 0.5)
      .attr('y2', innerHeight + paddingB)
      .attr('x1', _xScale(xFocus))
      .attr('x2', _xScale(xFocus));

    // Render y focus
    _yFocusSel.attr('transform', `translate(${-paddingL}, 0)`);
    _yFocusSel
      .attr('stroke-width', yFocus === null ? 0 : 0.5)
      .attr('x2', innerWidth + paddingL)
      .attr('y1', _yScale(yFocus))
      .attr('y2', _yScale(yFocus));

    // Render x markers
    _xMarkersSel.attr('transform', `translate(${-paddingL}, 0)`);
    let xMarkerSel = _xMarkersSel.selectAll('.marker').data(xMarkers);

    xMarkerSel.enter().append('line')
      .attr('class', 'marker')
      .attr('stroke-width', 0.5);

    xMarkerSel.exit().remove();

    xMarkerSel
      .attr('x1', _xScale)
      .attr('x2', _xScale)
      .attr('y2', innerHeight + paddingB);

    // Render y markers
    _yMarkersSel.attr('transform', `translate(${-paddingL}, 0)`);
    let yMarkerSel = _yMarkersSel.selectAll('.marker').data(yMarkers);

    yMarkerSel.enter().append('line')
      .attr('class', 'marker')
      .attr('stroke-width', 0.5);

    yMarkerSel.exit().remove();

    yMarkerSel
      .attr('y1', _yScale)
      .attr('y2', _yScale)
      .attr('x2', innerWidth + paddingL);

    // Resize overlay
    _overlaySel
      .attr('width', innerWidth)
      .attr('height', innerHeight);

  };

  const _onMouseover = () => {
    let [x, y] = _mouseToDomain(d3.event.offsetX, d3.event.offsetY);
    mouseoverHandler(x, y);
  };

  const _onMouseout = () => {
    mouseoutHandler();
  };

  const _onMousemove = () => {
    let [x, y] = _mouseToDomain(d3.event.offsetX, d3.event.offsetY);
    mousemoveHandler(x, y);
  };

  const _onClick = () => {
    let [x, y] = _mouseToDomain(d3.event.offsetX, d3.event.offsetY);
    clickHandler(x, y);
  };

  const _getExtent = (data, accessor, axisMarkers, pointMarkers) => {
    if (data.length + axisMarkers.length + pointMarkers.length === 0) {
      return [0, 1];
    }

    let min = +Infinity;
    let max = -Infinity;

    // Calculate extent for data
    for (let i = 0; i < data.length; ++i) {
      let values = data[i].values;
      for (let j = 0; j < values.length; ++j) {
        let value = accessor(values[j]);
        min = min < value ? min : value;
        max = max > value ? max : value;
      }
    }

    // Calculate extent for axis markers
    for (let i = 0; i < axisMarkers.length; ++i) {
      let value = axisMarkers[i];
      min = min < value ? min : value;
      max = max > value ? max : value;
    }

    // Calculate extent for point markers
    for (let i = 0; i < pointMarkers.length; ++i) {
      let value = accessor(pointMarkers[i]);
      min = min < value ? min : value;
      max = max > value ? max : value;
    }

    return [min, max];
  };

  const _mouseToDomain = (x, y) => {
    return [
      _xScale.invert(x - marginL - paddingL),
      _yScale.invert(y - marginT)
    ];
  };

  instance.update = _update;

  return instance;
};

export {
  linechart
};

