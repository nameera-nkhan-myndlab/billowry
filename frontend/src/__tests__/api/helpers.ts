export function mockReq(method: string, query: Record<string, any> = {}, body: any = undefined): any {
  return { method, query, body, headers: {} };
}

export function mockRes(): any {
  const r: any = { statusCode: 200, body: undefined, headers: {} };
  r.status = (c: number) => { r.statusCode = c; return r; };
  r.json = (b: any) => { r.body = b; return r; };
  r.setHeader = (k: string, v: any) => { r.headers[k] = v; };
  r.end = () => r;
  return r;
}