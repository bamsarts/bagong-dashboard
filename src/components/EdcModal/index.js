import { useEffect, useState, useContext } from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './EdcModal.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import generateClasses from '../../utils/generateClasses'
import Label from '../Label'
import { Col, Row } from '../Layout'
import * as XLSX from 'xlsx';
import Table from '../Table'
import { snakeToCamelCase } from '../../utils/case-converter'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null,
    type: "edcBank"
}

EdcModal.defaultProps = defaultProps

export default function EdcModal(props = defaultProps) {

    const CONFIG_PARAM = {
        "paymentType": "DEBIT",
        "serialNumber": "",
        "status": true,
        "app_code": "BISKU",
        "merchant_code": "",
        "terminal_code": "",
        "reference": "",
        "terminalId": "",
        "merchantId": "",
        "samUid": "",
        "samPin": "",
        "produkBus": "",
        "institutionId": "",
        "phoneNumber": ""
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_excelData, _setExcelData] = useState([])
    const [_tableColumns, _setTableColumns] = useState([])
    const [_inputMode, _setInputMode] = useState('form') // 'form' or 'import'
    const appContext = useContext(AppContext)
    const [_errorUpload, _setErrorUpload] = useState([])

    function _clearForm() {
        _setForm(CONFIG_PARAM)
        _setExcelData([])
        _setTableColumns([])
        _setInputMode('form')
    }

    function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _submitExcel() {
        if (_excelData.length === 0) {
            popAlert({ message: "Tidak ada data untuk disubmit" });
            return false;
        }

        _setIsProcessing(true);

        try {
            const results = [];
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < _excelData.length; i++) {
                const rowData = _excelData[i];

                // Validate and map Excel row to form structure
                const validatedForm = validateAndMapExcelRow(rowData);

                if (!validatedForm.isValid) {
                    results.push({
                        row: i + 1,
                        status: 'error',
                        message: validatedForm.errors.join(', ')
                    });
                    errorCount++;
                    continue;
                }

                // Submit individual row using existing _submitData logic
                const submitResult = await submitSingleRow(validatedForm.data);

                // Add 1 second delay after fetch completes
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (submitResult.success) {
                    results.push({
                        row: i + 1,
                        status: 'success',
                        message: 'Berhasil disimpan'
                    });
                    successCount++;
                } else {
                    results.push({
                        row: i + 1,
                        status: 'error',
                        message: submitResult.error
                    });
                    errorCount++;
                }
            }

            // Show summary
            const summaryMessage = `Selesai: ${successCount} berhasil, ${errorCount} gagal dari ${_excelData.length} data`;

            if (errorCount === 0) {
                popAlert({
                    message: summaryMessage,
                    type: "success"
                });
                props.closeModal();
                _clearForm();
                props.onSuccess();
            } else {
                _setErrorUpload(results)
                popAlert({
                    message: summaryMessage + ". Periksa console untuk detail error.",
                    type: "warning"
                });
                console.log("Detail hasil submit:", results);
            }

        } catch (e) {
            popAlert({ message: "Error saat submit: " + e.message });
        } finally {
            _setIsProcessing(false);
        }
    }

    function validateAndMapExcelRow(rowData) {
        const errors = [];
        let mappedData = {
            "serial_number": "",
            "value": {},
        };

        if(props.type == "edcTap"){
            mappedData.tap_type = ""
        }else{
            mappedData.status = true
            mappedData.phone_number = ""
            mappedData.paymentType = "DEBIT"
        }


        // Map Excel data to form structure
        Object.keys(rowData).forEach(excelKey => {
            if (mappedData.hasOwnProperty(excelKey) && rowData[excelKey]) {
                mappedData[excelKey] = rowData[excelKey];
            }
        });

        // Validate required fields based on type
        let requiredFields = ['serial_number', 'phone_number', 'status', 'value'];

        if (props.type === "edcTap") {
            requiredFields = ['tap_type', 'serial_number', 'value']
        }

        requiredFields.forEach(field => {
            if (!mappedData[field] || mappedData[field] === "") {
                errors.push(`Field ${field} wajib diisi`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors,
            data: mappedData
        };
    }

    async function submitSingleRow(formData) {
        try {
            let query = snakeToCamelCase(formData);

            if (query.phoneNumber == "NULL") query.phoneNumber = null

            // Convert string value to object based on type
            if (typeof query.value === 'string') {
                try {
                    query.value = JSON.parse(query.value);
                } catch (e) {
                    // If parsing fails, create object based on type
                    if (props.type === "edcBank") {
                        query.value = {
                            "terminal_code": query.terminalCode || "",
                            "app_code": query.appCode || "",
                            "merchant_code": query.merchantCode || ""
                        };
                    } else {
                        query.value = {
                            "terminalCode": query.terminalCode || "",
                            "appCode": query.appCode || "",
                            "merchantCode": query.merchantCode || "",
                            "serialNumber": query.serialNumber || "",
                            "reference": query.reference || "",
                            "terminalId": query.terminalId || "",
                            "merchantId": query.merchantId || "",
                            "samUid": query.samUid || "",
                            "samPin": query.samPin || "",
                            "produkBus": query.produkBus || "",
                            "institutionId": query.institutionId || ""
                        };
                    }
                }
            }

            const result = await postJSON('/masterData/' + props.type + '/add', query, appContext.authData.token);

            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async function _submitData() {

        let typeSubmit = 'add'
        let isFilled = true

        _setIsProcessing(true)

        try {
            let query = {
                ..._form
            }

            if (props.type == "edcBank") {
                query.value = {
                    "terminal_code": query.terminal_code,
                    "app_code": query.app_code,
                    "merchant_code": query.merchant_code
                }
            } else {
                query.value = {
                    "terminalCode": query.terminal_code,
                    "appCode": query.app_code,
                    "merchantCode": query.merchant_code,
                    "serialNumber": query.serialNumber,
                    "reference": query.reference,
                    "terminalId": query.terminalId,
                    "merchantId": query.merchantId,
                    "samUid": query.samUid,
                    "samPin": query.samPin,
                    "produkBus": query.produkBus,
                    "institutionId": query.institutionId
                }

                query.tapType = query.paymentType

                delete query.paymentType
                delete query.status
                delete query.phoneNumber
            }


            delete query.terminal_code
            delete query.app_code
            delete query.merchant_code
            delete query.reference
            delete query.terminalId
            delete query.merchantId
            delete query.samUid
            delete query.samPin
            delete query.produkBus
            delete query.institutionId
            delete query.payment_type
            delete query.serial_number
            delete query.terminalCode
            delete query.merchantCode
            delete query.appCode
            delete query.phone_number

            for (const prop in query) {

                if (query[prop] == "" && prop != "status") {
                    console.log(query[prop])
                    isFilled = false
                }
            }

            console.log(query)

            if (!isFilled) {
                popAlert({ "message": "Semua form wajib terisi" })
                _setIsProcessing(false)
                return false;
            }

            if (props.data.id) {
                typeSubmit = "update"
            }

            const result = await postJSON('/masterData/' + props.type + '/' + typeSubmit, query, appContext.authData.token)

            if (result) {
                props.closeModal()
                _clearForm()
                popAlert({ "message": "Berhasil disimpan", "type": "success" })
                props.onSuccess()
            }

        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    useEffect(() => {

        if (props.data?.id) {
            _updateQuery({
                ...props.data,
                "paymentType": props.data?.payment_type ? props.data.payment_type : 'EMONEY',
                "serialNumber": props.data?.serial_number,
                "status": props.data?.status == 1 ? true : false,
                "terminal_code": props.data?.terminal_code,
                "merchant_code": props.data?.merchant_code,
                "phoneNumber": props.data?.phone_number
            })
        }
    }, [props.data])

    const handleUpload = (e) => {
        const file = e.target.files[0];

        if (!file) {
            popAlert({ message: "Pilih file terlebih dahulu" });
            return;
        }

        // Validate file type
        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        if (!validTypes.includes(file.type)) {
            popAlert({ message: "Format file harus .xlsx atau .xls" });
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
            try {
                const data = event.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON with first row as headers
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: "" // Default value for empty cells
                });

                if (jsonData.length === 0) {
                    popAlert({ message: "File Excel kosong" });
                    return;
                }
                console.log(jsonData)
                // Process each row
                const processedData = processExcelData(jsonData);

                if (processedData.length > 0) {

                    // Set the processed data to state for table display
                    _setExcelData(processedData);

                    // Generate table columns from the first row keys
                    if (processedData[0]) {
                        const columns = Object.keys(processedData[0])
                            .filter(key => !key.startsWith('_')) // Exclude metadata fields
                            .map(key => ({
                                field: snakeToCamelCase(key),
                                title: key,
                                dataIndex: key,
                                minWidth: "100px"

                            }));
                        _setTableColumns(columns);

                        // Auto-fill first row data to form
                        fillFormFromExcelRow(processedData[0]);
                    }
                }

            } catch (error) {
                console.error("Error reading Excel file:", error);
                popAlert({ message: "Error membaca file Excel: " + error.message });
            }
        };

        reader.onerror = function () {
            popAlert({ message: "Error membaca file" });
        };

        reader.readAsArrayBuffer(file);
    }

    const processExcelData = (rawData) => {

        if (rawData.length < 2) {
            popAlert({ message: "File harus memiliki header dan minimal 1 baris data" });
            return [];
        }

        const headers = rawData[0]; // First row as headers
        const dataRows = rawData.slice(1); // Rest as data

        const processedRows = [];

        dataRows.forEach((row, index) => {
            // Skip empty rows
            if (row.every(cell => !cell || cell.toString().trim() === '')) {
                return;
            }

            const rowObject = {};
            headers.forEach((header, colIndex) => {
                if (header) {
                    // Clean header name and use as key
                    const cleanHeader = header.toString().trim().toLowerCase().replace(/\s+/g, '_');
                    rowObject[cleanHeader] = row[colIndex] ? row[colIndex].toString().trim() : '';
                }
            });

            // Add row metadata
            rowObject._rowIndex = index + 2; // +2 because we start from row 2 (after header)
            rowObject._originalRow = row;

            processedRows.push(rowObject);
        });

        return processedRows;
    }

    const fillFormFromExcelRow = (rowData) => {
        // Map Excel columns to form fields
        const fieldMapping = {
            'serial_number': 'serialNumber',
            'phone_number': 'phoneNumber',
            'value': 'value',
            'status': 'status'
        };

        const updateData = {};

        Object.keys(rowData).forEach(excelKey => {
            if (fieldMapping[excelKey] && rowData[excelKey]) {
                updateData[fieldMapping[excelKey]] = rowData[excelKey];
            }
        });

        if (Object.keys(updateData).length > 0) {
            _updateQuery(updateData);
            popAlert({
                message: "Data dari Excel berhasil dimuat ke form",
                type: "success"
            });
        }
    }

    return (
        <Modal
            visible={props.visible}
            centeredContent
        >
            <ModalContent
                header={{
                    title: props.data.id ? `Ubah ${props.type == 'edcBank' ? 'EDC Bank' : 'EDC Tap'}` : `Tambah ${props.type == 'edcBank' ? 'EDC Bank' : 'EDC Tap'}`,
                    closeModal: () => {
                        props.closeModal()
                        _clearForm()
                    },
                }}
            >

                <Col withPadding>
                    <p style={{ marginBottom: "1rem" }}>
                        Mode Input Data
                    </p>
                    <Label
                        activeIndex={_inputMode}
                        labels={[
                            {
                                class: "primary",
                                title: 'Form Manual',
                                value: "form",
                                isHide: false,
                                onClick: () => {
                                    _setInputMode('form')
                                    _setExcelData([])
                                    _setTableColumns([])
                                }
                            },
                            {
                                class: "warning",
                                title: 'Import Excel',
                                value: "import",
                                isHide: false,
                                onClick: () => {
                                    _setInputMode('import')
                                }
                            }
                        ]}
                    />
                </Col>

                {_inputMode === 'import' && (
                    <div style={{ margin: '1rem 0rem' }}>
                        <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                            Upload File Excel
                        </p>
                        <input
                            type={'file'}
                            accept={'.xls, .xlsx'}
                            onChange={handleUpload}
                            style={{ marginBottom: '1rem' }}
                        />

                        <a
                        href={ props.type == "edcBank" ? "/files/config-edc-bank.xlsx" : '/files/config-edc-emoney.xlsx'}
                        style={{
                            color: "blue"
                        }}
                        >
                            Format file 
                        </a>
                    </div>
                )}

                {_inputMode === 'import' && _excelData.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                        <Table
                            exportToXls={false}
                            columns={_tableColumns}
                            records={_excelData}
                        />

                        <pre style={{
                            backgroundColor: '#f5f5f5',
                            padding: '1rem',
                            borderRadius: '4px',
                            fontSize: '12px',
                            maxHeight: '300px',
                            overflow: 'auto'
                        }}>
                            {JSON.stringify(_errorUpload, null, 2)}
                        </pre>
                    </div>
                )}

                {_inputMode === 'form' && (
                    <>
                        <Col withPadding>
                            <p style={{ marginBottom: "1rem" }}>
                                Pembayaran
                            </p>

                            <Label
                                activeIndex={_form.paymentType}
                                labels={[
                                    {
                                        class: "warning",
                                        title: 'DEBIT',
                                        value: "DEBIT",
                                        isHide: props.type == "edcBank" ? false : true,
                                        onClick: () => {
                                            _updateQuery({
                                                "paymentType": "DEBIT"
                                            })
                                        }
                                    },
                                    {
                                        class: "primary",
                                        title: 'EMONEY',
                                        value: "EMONEY",
                                        isHide: props.type == "edcBank" ? true : false,
                                        onClick: () => {
                                            _updateQuery({
                                                "paymentType": "EMONEY"
                                            })
                                        }
                                    }
                                ]}
                            />
                        </Col>

                        <Input
                            withMargin
                            title={"Telepon"}
                            placeholder={'Masukan telepon'}
                            value={_form.phoneNumber}
                            onChange={(value) => {
                                _updateQuery({
                                    "phoneNumber": value
                                })
                            }}
                        />

                        <Input
                            withMargin
                            title={"Serial Number"}
                            placeholder={'Masukan serial number'}
                            value={_form.serialNumber}
                            onChange={(value) => {
                                _updateQuery({
                                    "serialNumber": value
                                })
                            }}
                        />

                        <Input
                            withMargin
                            title={"Kode Aplikasi"}
                            placeholder={'Masukan kode aplikasi'}
                            value={_form.app_code}
                            onChange={(value) => {
                                _updateQuery({
                                    "app_code": value
                                })
                            }}
                        />

                        <Input
                            withMargin
                            title={"Kode Merchant"}
                            placeholder={'Masukan kode merchant'}
                            value={_form.merchant_code}
                            onChange={(value) => {
                                _updateQuery({
                                    "merchant_code": value
                                })
                            }}
                        />

                        {
                            props.type == "edcTap" && (
                                <>
                                    <Input
                                        withMargin
                                        title={"Id Merchant"}
                                        placeholder={'Id Merchant'}
                                        value={_form.merchantId}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "merchantId": value
                                            })
                                        }}
                                    />
                                </>
                            )
                        }

                        <Input
                            withMargin
                            title={"Kode Terminal"}
                            placeholder={'Masukan kode terminal'}
                            value={_form.terminal_code}
                            onChange={(value) => {
                                _updateQuery({
                                    "terminal_code": value
                                })
                            }}
                        />

                        {
                            props.type == "edcTap" && (
                                <>
                                    <Input
                                        withMargin
                                        title={"Id Terminal"}
                                        placeholder={'Id Terminal'}
                                        value={_form.terminalId}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "terminalId": value
                                            })
                                        }}
                                    />

                                    <Input
                                        withMargin
                                        title={"Referensi"}
                                        placeholder={'Masukan referensi'}
                                        value={_form.reference}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "reference": value
                                            })
                                        }}
                                    />

                                    <Input
                                        withMargin
                                        title={"Id SAM"}
                                        placeholder={'Masukan ID SAM'}
                                        value={_form.samUid}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "samUid": value
                                            })
                                        }}
                                    />

                                    <Input
                                        withMargin
                                        title={"PIN SAM"}
                                        placeholder={'Masukan PIN SAM'}
                                        value={_form.samPin}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "samPin": value
                                            })
                                        }}
                                    />

                                    <Input
                                        withMargin
                                        title={"Produk Bus"}
                                        placeholder={'Masukan Produk Bus'}
                                        value={_form.produkBus}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "produkBus": value
                                            })
                                        }}
                                    />

                                    <Input
                                        withMargin
                                        title={"ID Institusi"}
                                        placeholder={'Masukan ID Institusi'}
                                        value={_form.institutionId}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "institutionId": value
                                            })
                                        }}
                                    />
                                </>
                            )
                        }

                        <Col withPadding>
                            <p style={{ marginBottom: "1rem" }}>
                                Status
                            </p>

                            <Label
                                activeIndex={_form.status}
                                labels={[
                                    {
                                        class: "primary",
                                        title: 'Aktif',
                                        value: true,
                                        isHide: false,
                                        onClick: () => {
                                            _updateQuery({
                                                "status": true
                                            })
                                        }
                                    },
                                    {
                                        class: "warning",
                                        title: 'Tidak Aktif',
                                        value: false,
                                        isHide: false,
                                        onClick: () => {
                                            _updateQuery({
                                                "status": false
                                            })
                                        }
                                    }
                                ]}
                            />
                        </Col>
                    </>
                )}

                <Col
                    withPadding
                    style={{
                        marginTop: "1rem"
                    }}
                >
                    {_inputMode === 'form' ? (
                        <Button
                            title={'Simpan'}
                            styles={Button.secondary}
                            onClick={_submitData}
                            onProcess={_isProcessing}
                        />
                    ) : (
                        <Button
                            title={`Submit ${_excelData.length} Data`}
                            styles={Button.primary}
                            onClick={_submitExcel}
                            onProcess={_isProcessing}
                            disabled={_excelData.length === 0}
                        />
                    )}
                </Col>


            </ModalContent>

        </Modal>
    )
}