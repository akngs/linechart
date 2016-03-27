import d3 from 'd3';

const SCALE_TYPES = {
  'linear': d3.scale.linear,
  'time': d3.time.scale
};

const linechart = () => {
  let instance = function(containerEl) {
    _init(containerEl);
    _render();
  };

  // Properties
  let data = [];
  instance.data = function(value) {
    return arguments.length ? (data = value, instance) : data;
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

  // Private variables
  let _containerEl;
  let _rootSel;
  let _xAxisSel;
  let _yAxisSel;
  let _plotSel;

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
  };

  const _render = () => {
    let xScale = new SCALE_TYPES[xScaleType]()
      .domain(_getNestedExtent(data, xAccessor))
      .rangeRound([0, width - marginL - marginR - paddingL]);
    let yScale = new SCALE_TYPES[yScaleType]()
      .domain(_getNestedExtent(data, yAccessor))
      .rangeRound([height - marginT - marginB - paddingB, 0]);

    let innerWidth = xScale.range()[1];
    let innerHeight = yScale.range()[0];
    let color = d3.scale.category10();
    let xScaledAccessor = (d, i) => xScale(xAccessor(d, i));
    let yScaledAccessor = (d, i) => yScale(yAccessor(d, i));

    // Resize container element
    _containerEl.setAttribute('width', width);
    _containerEl.setAttribute('height', height);
    _rootSel.attr(
        'transform',
        `translate(${marginL + paddingL}, ${marginT})`);

    // Render axes
    let xAxis = d3.svg.axis()
      .scale(xScale)
      .tickFormat(xAxisTickFormat)
      .tickSize(2)
      .ticks(5)
      .orient('bottom');
    let yAxis = d3.svg.axis()
      .scale(yScale)
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
  };

  const _getNestedExtent = (data, accessor) => {
    if (data.length === 0) { return [0, 1]; }

    let min = +Infinity;
    let max = -Infinity;
    for (let i = 0; i < data.length; ++i) {
      let values = data[i].values;
      for (let j = 0; j < values.length; ++j) {
        let value = accessor(values[j]);
        min = min < value ? min : value;
        max = max > value ? max : value;
      }
    }
    return [min, max];
  };

  return instance;
};

export {
  linechart,
};

