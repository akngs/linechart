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

  let props = {
    // Data
    data: [],
    xFocus: null,
    yFocus: null,
    pMarkers: [],
    xMarkers: [],
    yMarkers: [],
    xAccessor: (d, i) => i,
    yAccessor: (d, i) => d,
    y0AreaAccessor: null,
    y1AreaAccessor: null,
    xScaleType: 'linear',
    yScaleType: 'linear',
    interpolate: 'linear',
    regularQuadrant: false,

    // Style
    transitionDuration: 500,
    xAxisTickFormat: null,
    yAxisTickFormat: null,
    xAxisTickInside: false,
    yAxisTickInside: false,
    xAxisTickValues: null,
    yAxisTickValues: 'domain',
    xAxisLabel: null,
    yAxisLabel: null,
    width: 300,
    height: 150,
    marginL: 32,
    marginR: 18,
    marginT: 12,
    marginB: 18,
    paddingL: 8,
    paddingB: 8,
    showDataLine: true,
    showDataPoint: true
  };

  // Generate property accessors
  for (let key in props) {
    instance[key] = function(value) {
      return arguments.length ? (props[key] = value, instance) : props[key];
    };
  }

  // Event handlers
  let mouseoverHandler = (x, y, chart) => {};
  instance.onMouseover = function(value) {
    return (mouseoverHandler = value, instance);
  };

  let mouseoutHandler = (chart) => {};
  instance.onMouseout = function(value) {
    return (mouseoutHandler = value, instance);
  };

  let mousemoveHandler = (x, y, chart) => {};
  instance.onMousemove = function(value) {
    return (mousemoveHandler = value, instance);
  };

  let clickHandler = (x, y, chart) => {};
  instance.onClick = function(value) {
    return (clickHandler = value, instance);
  };

  // Private variables
  let _containerEl;
  let _rootSel;
  let _xAxisSel;
  let _yAxisSel;
  let _xAxisLabelSel;
  let _yAxisLabelSel;
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

    _xAxisLabelSel = _rootSel.selectAll('.axis-label-x').data([null]);
    _xAxisLabelSel.enter().append('text').attr('class', 'axis-label axis-label-x');

    _yAxisLabelSel = _rootSel.selectAll('.axis-label-y').data([null]);
    _yAxisLabelSel.enter().append('text').attr('class', 'axis-label axis-label-y');

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
    _xScale = new SCALE_TYPES[props.xScaleType]()
      .domain(_getExtent(
        props.data,
        'x',
        props.xAccessor,
        null,
        null,
        props.xMarkers,
        props.pMarkers
      ))
      .rangeRound([0, props.width - props.marginL - props.marginR - props.paddingL]);
    _yScale = new SCALE_TYPES[props.yScaleType]()
      .domain(_getExtent(
        props.data,
        'y',
        props.yAccessor,
        props.y0AreaAccessor,
        props.y1AreaAccessor,
        props.yMarkers,
        props.pMarkers
      ))
      .rangeRound([props.height - props.marginT - props.marginB - props.paddingB, 0]);

    if (props.regularQuadrant) {
      let extentX = _xScale.domain();
      let extentY = _yScale.domain();
      let maxX = Math.max(Math.abs(extentX[0]), Math.abs(extentX[1]));
      let maxY = Math.max(Math.abs(extentY[0]), Math.abs(extentY[1]));
      let max = Math.max(maxX, maxY);
      _xScale.domain([-max, max]);
      _yScale.domain([-max, max]);
    }

    let innerWidth = _xScale.range()[1];
    let innerHeight = _yScale.range()[0];
    let color = d3.scale.category10();
    let xScaledAccessor = (d, i) => _xScale(props.xAccessor(d, i));
    let yScaledAccessor = (d, i) => _yScale(props.yAccessor(d, i));

    // Resize container element
    _containerEl.setAttribute('width', props.width);
    _containerEl.setAttribute('height', props.height);
    _rootSel.attr(
        'transform',
        `translate(${props.marginL + props.paddingL}, ${props.marginT})`);

    // Render axes
    let xAxisTickValues = props.xAxisTickValues;
    if (xAxisTickValues === 'domain') {
      xAxisTickValues = _xScale.domain();
    }
    let xAxis = d3.svg.axis()
      .scale(_xScale)
      .tickFormat(props.xAxisTickFormat)
      .tickSize(props.xAxisTickInside ? -innerHeight - props.paddingB : 2)
      .tickValues(xAxisTickValues)
      .ticks(5)
      .orient('bottom');

    let yAxisTickValues = props.yAxisTickValues;
    if (yAxisTickValues === 'domain') {
      yAxisTickValues = _yScale.domain();
    }
    let yAxis = d3.svg.axis()
      .scale(_yScale)
      .tickFormat(props.yAxisTickFormat)
      .tickSize(props.yAxisTickInside ? -innerWidth - props.paddingL : 2)
      .tickValues(yAxisTickValues)
      .ticks(5)
      .orient('left');

    _xAxisSel
      .attr('transform', `translate(0, ${innerHeight + props.paddingB})`)
      .transition()
      .duration(props.transitionDuration)
      .call(xAxis);
    _yAxisSel
      .attr('transform', `translate(${-props.paddingL}, 0)`)
      .transition()
      .duration(props.transitionDuration)
      .call(yAxis);

    // Render axis labels
    _xAxisLabelSel
      .text(props.xAxisLabel)
      .attr('transform', `translate(${innerWidth}, ${innerHeight + props.paddingB - 2})`)
      .style('text-anchor', 'end')
      .style('alignment-baseline', 'after-edge');

    _yAxisLabelSel
      .text(props.yAxisLabel)
      .attr('transform', `translate(${-props.paddingL + 2}, 0)`)
      .style('text-anchor', 'start')
      .style('alignment-baseline', 'before-edge');

    // Render data area
    if (props.y0AreaAccessor && props.y1AreaAccessor) {
      let y0ScaledAccessor = (d, i) => _yScale(props.y0AreaAccessor(d, i));
      let y1ScaledAccessor = (d, i) => _yScale(props.y1AreaAccessor(d, i));
      let area = d3.svg.area()
        .x(xScaledAccessor)
        .y0(y0ScaledAccessor)
        .y1(y1ScaledAccessor)
        .interpolate(props.interpolate);

      let areaSel = _plotSel
        .selectAll('.area')
        .data(props.data, d => d.key);

      areaSel.enter().append('path')
        .attr('class', 'area')
        .attr('opacity', 0.1)
        .attr('stroke', 'none');

      areaSel.exit().remove();

      areaSel
        .attr('fill', (d, i) => color(i))
        .transition()
        .duration(props.transitionDuration)
        .attr('d', d => area(d.values));
    }

    // Render data lines
    let line = d3.svg.line()
      .x(xScaledAccessor)
      .y(yScaledAccessor)
      .interpolate(props.interpolate);

    let lineSel = _plotSel
      .selectAll('.line')
      .data(props.showDataLine ? props.data : [], d => d.key);

    lineSel.enter().append('path')
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke-width', 1);

    lineSel.exit().remove();

    lineSel
      .attr('stroke', (d, i) => color(i))
      .transition()
      .duration(props.transitionDuration)
      .attr('d', d => line(d.values));

    // Render data points
    let pointsSel = _plotSel
      .selectAll('.points')
      .data(props.showDataPoint ? props.data : [], d => d.key);

    pointsSel.enter().append('g')
      .attr('class', 'points');

    pointsSel.exit().remove();

    let pointSel = pointsSel.selectAll('.point').data(d => d.values);

    pointSel.enter().append('circle')
      .attr('class', 'point')
      .attr('cx', xScaledAccessor)
      .attr('cy', yScaledAccessor);

    pointSel.exit().remove();

    pointSel
      .attr('stroke', (d, i, j) => color(j))
      .attr('fill', 'none')
      .transition()
      .duration(props.transitionDuration)
      .attr('cx', xScaledAccessor)
      .attr('cy', yScaledAccessor)
      .attr('r', 2)
      .attr('stroke-width', 1);

    // Render point markers
    let pMarkerSel = _pMarkersSel.selectAll('.marker').data(props.pMarkers);

    pMarkerSel.enter().append('g')
      .attr('class', 'marker')
      .attr('transform', d => `translate(${_xScale(d.x)}, ${_yScale(d.y)})`)
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
      .attr('class', d => `marker ${d.className || ''}`)
      .transition()
      .duration(props.transitionDuration)
      .attr('transform', d => `translate(${_xScale(d.x)}, ${_yScale(d.y)})`);

    // Render x focus
    _xFocusSel
      .attr('stroke-width', props.xFocus === null ? 0 : 0.5)
      .attr('y2', innerHeight + props.paddingB)
      .attr('x1', _xScale(props.xFocus))
      .attr('x2', _xScale(props.xFocus));

    // Render y focus
    _yFocusSel.attr('transform', `translate(${-props.paddingL}, 0)`);
    _yFocusSel
      .attr('stroke-width', props.yFocus === null ? 0 : 0.5)
      .attr('x2', innerWidth + props.paddingL)
      .attr('y1', _yScale(props.yFocus))
      .attr('y2', _yScale(props.yFocus));

    // Render x markers
    let xMarkerSel = _xMarkersSel.selectAll('.marker').data(props.xMarkers);

    xMarkerSel.enter().append('line')
      .attr('class', 'marker')
      .attr('x1', _xScale)
      .attr('x2', _xScale)
      .attr('y2', innerHeight + props.paddingB)
      .attr('stroke-width', 0.5);

    xMarkerSel.exit().remove();

    xMarkerSel
      .attr('class', d => `marker ${d.className || ''}`)
      .transition()
      .duration(props.transitionDuration)
      .attr('x1', _xScale)
      .attr('x2', _xScale)
      .attr('y2', innerHeight + props.paddingB);

    // Render y markers
    _yMarkersSel.attr('transform', `translate(${-props.paddingL}, 0)`);
    let yMarkerSel = _yMarkersSel.selectAll('.marker').data(props.yMarkers);

    yMarkerSel.enter().append('line')
      .attr('class', 'marker')
      .attr('y1', _yScale)
      .attr('y2', _yScale)
      .attr('x2', innerWidth + props.paddingL)
      .attr('stroke-width', 0.5);

    yMarkerSel.exit().remove();

    yMarkerSel
      .attr('class', d => `marker ${d.className || ''}`)
      .transition()
      .duration(props.transitionDuration)
      .attr('y1', _yScale)
      .attr('y2', _yScale)
      .attr('x2', innerWidth + props.paddingL);

    // Resize overlay
    _overlaySel
      .attr('width', innerWidth)
      .attr('height', innerHeight);
  };

  const _onMouseover = () => {
    let [x, y] = _mouseToDomain(d3.event.offsetX, d3.event.offsetY);
    mouseoverHandler(x, y, instance);
  };

  const _onMouseout = () => {
    mouseoutHandler(instance);
  };

  const _onMousemove = () => {
    let [x, y] = _mouseToDomain(d3.event.offsetX, d3.event.offsetY);
    mousemoveHandler(x, y, instance);
  };

  const _onClick = () => {
    let [x, y] = _mouseToDomain(d3.event.offsetX, d3.event.offsetY);
    clickHandler(x, y, instance);
  };

  const _getExtent = (
    data, axis, accessor, v0AreaAccessor, v1AreaAccessor, axisMarkers, pointMarkers
  ) => {
    if (data.length + axisMarkers.length + pointMarkers.length === 0) {
      return [0, 1];
    }

    let min = +Infinity;
    let max = -Infinity;

    // Calculate extent for data
    for (let i = 0; i < data.length; ++i) {
      let values = data[i].values;
      for (let j = 0; j < values.length; ++j) {
        let value = accessor(values[j], j);
        min = min < value ? min : value;
        max = max > value ? max : value;
      }
    }

    // Calculate extent for area data
    if (v0AreaAccessor && v1AreaAccessor) {
      for (let i = 0; i < data.length; ++i) {
        let values = data[i].values;
        for (let j = 0; j < values.length; ++j) {
          let value0 = v0AreaAccessor(values[j], j);
          let value1 = v1AreaAccessor(values[j], j);
          let minValue = Math.min(value0, value1);
          let maxValue = Math.max(value0, value1);

          min = min < minValue ? min : minValue;
          max = max > maxValue ? max : maxValue;
        }
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
      let value = pointMarkers[i][axis];
      min = min < value ? min : value;
      max = max > value ? max : value;
    }

    return [min, max];
  };

  const _mouseToDomain = (x, y) => {
    return [
      _xScale.invert(x - props.marginL - props.paddingL),
      _yScale.invert(y - props.marginT)
    ];
  };

  instance.update = _update;
  instance.getXDomain = () => {
    return _xScale.domain();
  };
  instance.getYDomain = () => {
    return _yScale.domain();
  };

  return instance;
};

export {
  linechart
};

