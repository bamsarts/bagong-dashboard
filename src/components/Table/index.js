import { useState, useEffect } from 'react'

import { writeXLSX, utils, writeFile } from 'xlsx'
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaChevronLeft, FaChevronRight, FaFileExcel } from 'react-icons/fa'

import Button from '../Button'
import { Row, Col } from '../Layout'

import styles from './Table.module.scss'
import generateClasses from '../../utils/generateClasses'

const defaultProps = {
    tableHeaders : null,
    insertColumns : null,
    columns : [],
    records : [],
    onRowClick : null,
    headerContent : null,
    onSelectionChange : null,
    selectionDataFilter : null,
    onRecordsPerPageChange: null,
    onPageChange: null,
    defaultLength: 10,
    recordsPerPageValues: [10, 25, 50, 2000, 5000, 10000],
    config: {
        recordLength: null,
        recordsPerPage: 10,
        activePage: 0,
        totalPages: 1,
    },
    styles : null,
    showFooter : false,
    noPadding : false,
    customRow : null,
    exportToXls : true,
    id: 0,
    extraLarge: false,
    headExport: [],
    headContent: [],
    textAlign: '',
    fileName: 'exported-data',
    isLoading: false,
    insertExport: []
}

/**
 * Table Component
 * 
 * Column configuration supports:
 * - minWidth: string (e.g., "200px", "10rem") - Sets minimum width for column
 * - title: string - Column header text
 * - field: string - Data field name
 * - customCell: function - Custom cell renderer
 * - textAlign: string - Text alignment ("left", "right", "center")
 * - hide: boolean - Hide column
 * - style: object - Additional inline styles
 * 
 * Example:
 * {
 *   title: "Name",
 *   field: "name", 
 *   minWidth: "200px",
 *   textAlign: "left"
 * }
 */

Table.defaultProps = defaultProps

export default function Table(props = defaultProps) {

    const [_checked, _setChecked] = useState([])

    useEffect(() => {
        if (props.onSelectionChange) {
            props.onSelectionChange(_checked)
        }
    }, [_checked])

    function _check(value) {
        const index = _checked.findIndex(i => i === value)
        let checked = [..._checked]
        if (index < 0) {
            checked.push(value)
        } else {
            checked.splice(index, 1)
        }
        _setChecked(checked)
    }

    function _checkAll(field) {
        let checked
        if (_checked.length === props.records.length && _checked.length !== 0) {
            checked = []
        } else {
            const selectionData = props.records.filter(item => props.selectionDataFilter(item))
            checked = selectionData.map(item => {
                return item[field]
            })
        }
        _setChecked(checked)
    }

    function _isAllChecked() {
        const selectionData = props.records.filter(item => props.selectionDataFilter(item))
        return selectionData.length === _checked.length
    }

    function _setPage(value) {
        if (props.config.activePage === 1 && value < 0) {
          return false;
        }
    
        if (props.config.activePage === props.config.totalPages && value > 0) {
          return false;
        }
    
        props.onPageChange(props.config.activePage + value);
    }

    function _renderToString() {
        let template = document.createElement('template')
        if(props.headExport.length > 0){
            
            let tableExport = '<table>';

            if(props.headContent.length > 0){
                props.headContent.forEach(function(val, key){
                    tableExport += `<tr><td>${val.title}</td><td>${val.value}</td></tr>`
                })
                tableExport += '<tr></tr>'
            }

            tableExport += `<tr>`
            
            props.headExport.forEach(function(val, key){
                if(!val.hide){
                    tableExport += '<td>'+val.title+"</td>"
                }
            })

            tableExport += '</tr>';

            props.records.forEach(function(val, key){
                tableExport += `<tr>`;

                props.headExport.forEach(function(i, j){
                    if(!i.hide){
                        let content = val[i.value] != null ? val[i.value] : ""

                        if(i?.enum){
                            content = val[i.value] ? i.enum[0] : i.enum[1]
                        }

                        if(i?.customCell){
                            content =  i.customCell(val[i.value], val)
                        }
    
                        tableExport += `<td>`+content+"</td>";
                    }
                })

                tableExport += '</tr>';
            })

            tableExport += "<tr></tr><tr></tr>"

            props.insertExport.forEach(function(val, key){
                tableExport += "<tr>"
                tableExport += `<td>`+val.title+"</td>";
                tableExport += `<td>`+val.value+"</td>";
                tableExport += "</tr>"
            })


            tableExport += '</tbody></table>';

            template.innerHTML = tableExport
        
        }else{
            let tes = document.getElementById('react-table').innerHTML.replace(/<div>|<\/div>|\./g, '')
            tes = tes.trim()
            template.innerHTML = `<table>${tes}</table>`
        }

        const wb = utils.table_to_book(template.content.firstChild)
        return writeFile(wb, `${props.fileName}.xlsx`)
    }

    function _triggerExport(){
        let content = document.getElementById('btn-excel');
        content.firstChild.firstChild.click()
    }

    return (
        <>
            {
                (props.headerContent || props.exportToXls) && (
                    <div
                    className={styles.table_header}
                    >
                        <Row
                        verticalCenter
                        >
                            <Col
                            column={5}
                            mobileFullWidth
                            >
                                <div
                                className={styles.header_content}
                                >
                                    {props.headerContent}
                                </div>
                            </Col>
                            <Col
                            column={1}
                            mobileFullWidth
                            >
                                <div
                                id={"btn-excel"}
                                className={styles.export_actions}
                                onClick={_triggerExport}
                                >
                                    {props.rightHeaderContent}
                                    {
                                        props.exportToXls && (
                                            <Button
                                            styles={Button.success}
                                            tooltip='Export XLS'
                                            onClick={_renderToString}
                                            small
                                            icon={<FaFileExcel/>}
                                            />
                                        )
                                    }
                                </div>
                            </Col>
                        </Row>
                    </div>
                )
            }
            <div
            className={styles.table_container}
            style={props.style}
            >
                <div
                className={styles.table_wrapper}
                >
                    <table
                    id={'react-table'}
                    cellPadding={0}
                    cellSpacing={0}
                    width={'100%'}
                    className={generateClasses([
                        styles.table,
                        props.isLoading && styles.animate
                    ])}
                    style={{
                        "min-width": props.extraLarge && "1300px",
                    }}
                    >
                        <thead
                        >
                            {
                                !props.tableHeaders && (
                                    <tr>
                                        {
                                            props.columns.map((column, key) => {
                                                if (!column.hide) {
                                                    return (
                                                        <th
                                                        key={key}
                                                        style={{
                                                            ...(column?.minWidth && {"min-width": column.minWidth}),
                                                            ...(column?.headCol && column.headCol)
                                                        }}
                                                        >
                                                            {
                                                                column.checkbox
                                                                ? (
                                                                    <div
                                                                    className={styles.checkbox}
                                                                    >
                                                                        <input
                                                                        type={'checkbox'}
                                                                        checked={_isAllChecked()}
                                                                        onChange={() => _checkAll(column.field)}
                                                                        />
                                                                    </div>
                                                                )
                                                                : (
                                                                    <div>
                                                                        {column.title}
                                                                    </div>
                                                                )
                                                            }
                                                        </th>
                                                    )
                                                }
                                            })
                                        }
                                    </tr>
                                )
                            }
                            {
                                props.tableHeaders && (
                                    props.tableHeaders.map((row, key) => {
                                        return (
                                            <tr
                                            key={key}
                                            >
                                                {
                                                    row.map((column, key2) => {
                                                        if (!column.hide) {

                                                            return (
                                                                <th
                                                                key={key2}
                                                                colSpan={column.colSpan}
                                                                rowSpan={column.rowSpan}
                                                                >
                                                                    {
                                                                        column.checkbox
                                                                        ? (
                                                                            <div
                                                                            className={styles.checkbox}
                                                                            >
                                                                                <input
                                                                                type={'checkbox'}
                                                                                checked={_isAllChecked()}
                                                                                onChange={() => _checkAll(column.field)}
                                                                                />
                                                                            </div>
                                                                        )
                                                                        : (
                                                                            <div>
                                                                                {column.title}
                                                                            </div>
                                                                        )
                                                                    }
                                                                </th>
                                                            )
                                                            
                                                        }
                                                    })
                                                }
                                            </tr>
                                        )
                                    })
                                )
                            }
                        </thead>
                        <tbody>
                            {
                                props.records.map((record, key) => {

                                    if (props.customRow) {
                                        return props.customRow(record, key)
                                    } else {
                                        return (
                                            <tr
                                            key={key}
                                            onClick={() => props.onRowClick ? props.onRowClick(record) : false}
                                            >
                                                {
                                                    props.columns.map((column, key2) => {
                                                        if (!column.hide) {
                                                            const value = record[column.field]
                                                            // if(value != null){
                                                                return (
                                                                    <td
                                                                    key={key2}
                                                                    className={column.className}
                                                                    style={{
                                                                        ...column.style,
                                                                        ...(column?.minWidth && {"min-width": column.minWidth})
                                                                    }}
                                                                    >
                                                                        {
                                                                            column.checkbox
                                                                            ? (
                                                                                <div
                                                                                className={styles.checkbox}
                                                                                >
                                                                                    <input
                                                                                    type={'checkbox'}
                                                                                    checked={_checked.includes(value || key) || column.disabled(record)}
                                                                                    onChange={() => {
                                                                                        _check(value || key)
                                                                                    }}
                                                                                    disabled={column.disabled(record)}
                                                                                    />
                                                                                </div>
                                                                            )
                                                                            : (
                                                                                <div
                                                                                className={generateClasses([
                                                                                    column.textAlign == "left" && styles.text_left,
                                                                                    column.textAlign == "right" && styles.text_right
                                                                                ])}
                                                                                >
                                                                                    {
                                                                                        column.customCell ? column.customCell(value, record, key) : value
                                                                                    }
                                                                                </div>
                                                                            )
                                                                        }
                                                                    </td>
                                                                )

                                                            // }
                                                        }
                                                    })
                                                }
                                            </tr>
                                        )
                                    }

                                })
                            }
                            {
                                props.insertColumns && (
                                    props.insertColumns.map((row, key) => {
                                        return (
                                            <tr
                                            key={key}
                                            >
                                                {
                                                    row.map((column, key2) => {
                                                        if(!column.hide){
                                                            return (
                                                                <td
                                                                key={key2}
                                                                colSpan={column.colSpan}
                                                                rowSpan={column.rowSpan}
                                                                style={{
                                                                    ...(column?.minWidth && {"min-width": column.minWidth})
                                                                }}
                                                                >
                                                                    <div
                                                                    className={generateClasses([
                                                                        column.textAlign == "left" && styles.text_left,
                                                                        column.textAlign == "right" && styles.text_right
                                                                    ])}
                                                                    >
                                                                        {column.customCell ? column.customCell(column.value) : column.value}
                                                                    </div>
                                                                </td>
                                                            )
                                                        }
                                                    })
                                                }
                                            </tr>
                                        )
                                    })
                                )
                            }
                            {
                                props.showFooter && (
                                    <tr
                                    className={styles.footer}
                                    >
                                        {
                                            props.columns.map((column, key) => {
                                                if (!column.hide) {
                                                    return (
                                                        <td
                                                        key={key}
                                                        style={{
                                                            ...(column?.minWidth && {"min-width": column.minWidth})
                                                        }}
                                                        >
                                                            <b>
                                                                {column.footer ? column.footer() : ''}
                                                            </b>
                                                        </td>
                                                    )
                                                }
                                            })
                                        }
                                    </tr>
                                )
                            }
                        </tbody>
                    </table>
                    <div
                    className={styles.table_footer}
                    >
                        {
                            props.onRecordsPerPageChange && (
                                <div
                                className={styles.records_per_page_selector}
                                >
                                    <span>Show&nbsp;</span>
                                    <select
                                    className={styles.records_per_page}
                                    id=""
                                    onChange={(e) =>
                                        props.onRecordsPerPageChange &&
                                        props.onRecordsPerPageChange(e.currentTarget.value)
                                    }
                                    >
                                        {
                                            props.recordsPerPageValues.map((value, key) => {
                                                return (
                                                    <option selected={props.defaultLength == parseInt(value) ? "selected" : ""} value={value}>
                                                        {value}
                                                    </option>
                                                )
                                            })
                                        }
                                    </select>
                                    <div>&nbsp;records per page</div>
                                </div>
                        )}

                        <span>
                            Total Records {props.config.recordLength || props.records.length}
                        </span>

                        <div
                        className={styles.pagination_container}>
                            {
                                props.config.totalPages > 1 && (
                                    <div
                                    className={styles.pagination}
                                    >
                                        <div
                                        className={styles.pagination_title}>
                                            Page
                                        </div>
                                        <div
                                        className={styles.page_nav}
                                        onClick={() => _setPage((props.config.activePage * -1) + 1)}
                                        >
                                            <FaAngleDoubleLeft/>
                                        </div>
                                        <div
                                        className={styles.page_nav}
                                        onClick={() => _setPage(-1)}
                                        >
                                            <FaChevronLeft/>
                                        </div>
                                        <div
                                        className={styles.page_count}>
                                            <input
                                            type={'number'}
                                            value={props.config.activePage}
                                            className={styles.page_input}
                                            min={1}
                                            max={props.config.totalPages}
                                            />
                                            <span>/ {props.config.totalPages}</span>
                                        </div>
                                        <div
                                        className={styles.page_nav}
                                        onClick={() => _setPage(1)}
                                        >
                                            <FaChevronRight/>
                                        </div>
                                        <div
                                        className={styles.page_nav}
                                        onClick={() => _setPage(props.config.totalPages - props.config.activePage)}
                                        >
                                            <FaAngleDoubleRight/>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    )

}