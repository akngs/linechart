import d3 from 'd3';
import { linechart } from '../../src/linechart';

describe('Basics', function() {
  it('should prodives accessor for properties', () => {
    let chart = linechart();

    expect(chart.width(1)).to.equal(chart);
    expect(chart.width()).to.equal(1);

    expect(chart.height(2)).to.equal(chart);
    expect(chart.height()).to.equal(2);

    expect(chart.data([[1]])).to.equal(chart);
    expect(chart.data()).to.deep.equal([[1]]);
  });
});

describe('Rendering', function() {
  let isBrowser = false;

  beforeEach(function() {
    isBrowser = (() => {
      try {
        window;
        return true;
      } catch (e) {
        return false;
      }
    })();
  });

  it('should work with indexed x-axis', function() {
    if (!isBrowser) { return; }

    let svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svgEl);

    let data = [
      {key: 'A', values: [1, 3, 2, 4]},
      {key: 'B', values: [5, 4, 3, 1]}
    ];
    let chart = linechart()
      .data(data)
      .interpolate('monotone');
    chart(svgEl);
  });

  it('should generate components', function() {
    if (!isBrowser) { return; }

    let svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svgEl);

    let dateFormat = d3.time.format('%Y-%m-%d');
    let convertLine = d => {
      return {key: d.key, ts: dateFormat.parse(d.ts), value: +d.value, interval: +d.interval};
    };

    let data = d3.nest()
      .key(d => d.key)
      .entries(d3.csv.parse([
        'key,ts,value,interval',
        'a,2012-01-15,30,2',
        'a,2012-03-01,50,3',
        'a,2012-05-01,40,4',
        'b,2012-02-01,20,10',
        'b,2012-03-01,30,8',
        'b,2012-04-01,110,7',
        'b,2012-05-01,5,1'
      ].join('\n'), convertLine));

    let chart = linechart()
      .data(data)
      .interpolate('monotone')
      .xAccessor(d => d.ts)
      .yAccessor(d => d.value)
      .y0AreaAccessor(d => d.value - d.interval)
      .y1AreaAccessor(d => d.value + d.interval)
      .yAxisTickValues([0,50,100])
      .xScaleType('time')
      .xAxisTickFormat(d3.time.format('%m-%d'))
      .xMarkers([new Date(2012, 1, 15), new Date(2012, 2, 15)])
      .yMarkers([40, 73])
      .pMarkers([
        {ts: new Date(2012, 1, 15), value: 100},
        {ts: new Date(2012, 3, 1), value: 28}
      ])
      .xAxisLabel('date')
      .yAxisLabel('ch')
      .width(400)
      .height(150)
      .onMousemove((x, y) => {
        chart
          .xFocus(x)
          .yFocus(y)
          .update();
      })
      .onMouseout(() => {
        chart
          .xFocus(null)
          .yFocus(null)
          .update();
      })
      .onClick((x, y) => {console.log([x, y]);});
    chart(svgEl);

    expect(svgEl.querySelector('g.root')).to.be.ok;
    expect(svgEl.querySelector('g.root g.axis.axis-x')).to.be.ok;
    expect(svgEl.querySelector('g.root g.axis.axis-y')).to.be.ok;
    expect(svgEl.querySelector('g.root g.plot')).to.be.ok;
    expect(svgEl.querySelector('g.root rect.overlay')).to.be.ok;

    expect(svgEl.querySelectorAll('g.root g.plot .line').length).to.equal(2);
  });
});
