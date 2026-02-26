export function fee10(subtotalCents: number) {
  return Math.round(subtotalCents * 0.10);
}

export function isInternalJob(req: Request) {
  const secret = req.headers.get("x-job-secret");
  return !!secret && secret === process.env.INTERNAL_JOB_SECRET;
}

export function containsCredentials(text: string) {
  const banned =
    /(contraseñ|password|pass:|usuario:|user:|correo\s*:\s*.*@|email\s*:\s*.*@)/i;
  return banned.test(text);
}
