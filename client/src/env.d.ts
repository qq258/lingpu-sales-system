declare module 'vue3-barcode' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{
    value: string | number
    format?: string
    width?: number
    height?: number
    displayValue?: boolean
    text?: string
    fontOptions?: string
    font?: string
    textAlign?: string
    textPosition?: string
    textMargin?: number
    fontSize?: number
    background?: string
    lineColor?: string
    margin?: number
    marginTop?: number
    marginBottom?: number
    marginLeft?: number
    marginRight?: number
    tag?: string
  }>
  export default component
}
