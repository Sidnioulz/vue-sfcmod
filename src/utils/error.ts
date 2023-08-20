export default function error(message: string, data: unknown) {
  throw new Error(`${message}\n${JSON.stringify(data, null, 2)}`)
}
