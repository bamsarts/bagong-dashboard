export default function paymentProvider(id){
    //1. Midtrans
    //2. Damri
    //3. TSM
    //4. Faspay
    const providers = ["","Midtrans","PO","TSM","Faspay","Winpay","Bank Mandiri","Indomaret"]
    
    if (!Number.isInteger(id)) {
        return ''
    }

    if(parseInt(id) <= providers.length){
        return providers[id]
    }else{
        return ''
    }
}