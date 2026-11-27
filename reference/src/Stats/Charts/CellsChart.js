const CellStates = require("../../Organism/Cell/CellStates");
const FossilRecord = require("../FossilRecord");
const ChartController = require("./ChartController");

class CellsChart extends ChartController {
    constructor() {
        super("Organism Size / Composition", 
            "Avg. Number of Cells per Organism",
            "Note: to maintain efficiency, species with very small populations are discarded when collecting cell statistics.");
    }

    setData() {
        this.clear();
        //this.mouth, this.producer, this.mover, this.killer, this.armor, this.eye
        this.data.push({
                type: "line",
                markerType: "none",
                color: 'black',
                showInLegend: true, 
                name: "pop1",
                legendText: "Avg. organism size",
                dataPoints: []
            }
        );
        for (var c of CellStates.living) {
            this.data.push({
                type: "line",
                markerType: "none",
                color: c.color,
                showInLegend: true, 
                name: c.name,
                legendText: "Avg. " + c.name + " cells",
                dataPoints: []
            }
        );
        }
        this.addAllDataPoints();


    }

    render() {
        super.render();
        this.renderTable();
    }

    // latest averages as numbers, since rare cell types are too small to see in the graph
    renderTable() {
        const last=FossilRecord.tick_record.length-1;
        const table=$('#cell-table').empty();
        if (last<0) return;
        const counts=FossilRecord.av_cell_counts[last];
        const total=FossilRecord.av_cells[last];

        const row=(tag,values)=>$('<tr>').append(values.map(v=>$(`<${tag}>`).text(v)));
        const body=$('<tbody>');
        for (const c of CellStates.living) {
            const count=counts[c.name]||0;
            const share=total>0?count/total*100:0;
            const tr=row('td',[c.name,count.toFixed(3),share.toFixed(2)+'%']);
            tr.children().first().prepend($('<span class="swatch">').css('background-color',c.color));
            body.append(tr);
        }
        table.append(
            $('<table>').append(
                $('<caption>').text('Contribution at tick '+FossilRecord.tick_record[last]),
                $('<thead>').append(row('th',['Cell type','Avg. per organism','Share'])),
                body,
                $('<tfoot>').append(row('td',['Total',total.toFixed(3),total>0?'100%':'0%']))
            )
        );
    }

    addDataPoint(i) {
        var t = FossilRecord.tick_record[i];
        var p = FossilRecord.av_cells[i];
        this.data[0].dataPoints.push({x:t, y:p});
        var j=1;
        for (var name in FossilRecord.av_cell_counts[i]) {
            var count = FossilRecord.av_cell_counts[i][name];
            this.data[j].dataPoints.push({x:t,y:count})
            j++;
        }
    }
}

module.exports = CellsChart;