export default function generateClasses(inputClasses = []) {

    let classes = []

    inputClasses.forEach((item) => {
        if (typeof item === 'string') {
            classes.push(item)
        }
        if (typeof item === 'object') {
            for (const key in item) {
                if (item[key]) {
                    classes.push(key)
                }
            }
        }
    })

    return classes.join(' ')

}