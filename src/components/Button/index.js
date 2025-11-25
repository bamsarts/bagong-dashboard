import ActivityIndicator from '../ActivityIndicator'

import generateClasses from '../../utils/generateClasses'

import styles from './Button.module.scss'
import backgroundColor from '../../styles/sass/background-color.module.scss'
import { writeXLSX, utils, writeFile } from 'xlsx'
import { initializeTheme, getSubdomain, getThemeBySubdomain } from '../../utils/theme'

const defaultProps = {
    title: '',
    disabled: false,
    onProcess: false,
    rounded: false,
    icon: null,
    styles: null,
    onClick: () => false,
    small: false,
    backgroundColor: null,
    fluidWidth: false,
    tooltip: '',
    marginLeft: false,
    headExport: [],
    dataExport: [],
    titleExport: "exported-data.xlsx",
    insertExport: [],
    id: "btn"
}

Button.defaultProps = defaultProps

Button.primary = backgroundColor.primary
Button.secondary = backgroundColor.secondary
Button.success = backgroundColor.success
Button.warning = backgroundColor.warning
Button.error = backgroundColor.error
Button.info = backgroundColor.info
Button.dark = backgroundColor.dark
Button.medium_dark = backgroundColor.medium_dark

export default function Button(props = defaultProps) {

    // if (typeof window !== "undefined") {
    //     const subdomain = getSubdomain(window.location.hostname)
    //     const theme = getThemeBySubdomain(subdomain)

    //     Button.primary = theme.bgColor
    // }

    function _exportXls() {
        if (props.dataExport.length > 0) {
            let template = document.createElement('template')
            let tableExport = '<table>';

            tableExport += `<tr>`

            props.headExport.forEach(function (val, key) {
                if (!val.hide) {
                    tableExport += '<td>' + val.title + "</td>"
                }
            })

            tableExport += '</tr>';

            props.dataExport.forEach(function (val, key) {
                tableExport += `<tr>`;

                props.headExport.forEach(function (i, j) {
                    if (!i.hide) {
                        let content = val[i.value] != null ? val[i.value] : ""

                        if (i?.enum) {
                            content = val[i.value] ? i.enum[0] : i.enum[1]
                        }

                        if (i?.customCell) {
                            content = i.customCell(val[i.value], val)
                        }

                        tableExport += `<td>` + content + "</td>";
                    }
                })

                tableExport += '</tr>';
            })


            props.insertExport.forEach(function (val, key) {
                tableExport += "<tr>"
                tableExport += `<td>` + val.title + "</td>"
                tableExport += `<td>` + val.value + "</td>"
                tableExport += "</tr>"
            })



            tableExport += '</tbody></table>';

            template.innerHTML = tableExport

            const wb = utils.table_to_book(template.content.firstChild)
            return writeFile(wb, props.titleExport)
        }
    }

    function _onClick(e) {
        props.onClick()
        if (!e) e = window.event
        e.cancelBubble = true
        if (e.stopPropagation) e.stopPropagation()

        if (props.dataExport.length > 0) _exportXls()
    }

    return (
        <div
            id={props.id}
            className={generateClasses([
                props.styles || Button.primary,
                styles.container,
                props.rounded && styles.rounded,
                (props.disabled || props.onProcess) && styles.disabled,
                props.small && styles.small_button,
                props.fluidWidth && styles.fluid_width,
                props.marginLeft && styles.margin_left
            ])}
            onClick={props.disabled || props.onProcess ? null : _onClick}
            style={{
                backgroundColor: props.backgroundColor || null,
            }}
        >
            {
                props.onProcess
                    ? (
                        <ActivityIndicator />
                    )
                    : (
                        <>
                            {
                                props.icon && (
                                    <div
                                        className={generateClasses([
                                            styles.icon_container,
                                            !props.title && styles.no_title
                                        ])}
                                    >
                                        {props.icon}
                                    </div>
                                )
                            }

                            <p>
                                {props.title}
                            </p>

                            {
                                props.iconRight && (
                                    <div
                                        className={generateClasses([
                                            styles.icon_right_container,
                                            !props.title && styles.no_title
                                        ])}
                                    >
                                        {props.iconRight}
                                    </div>
                                )
                            }
                        </>
                    )
            }
            {
                props.tooltip && (
                    <div
                        className={styles.tooltip}
                    >
                        {props.tooltip}
                    </div>
                )
            }
        </div>
    )

}