import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../lib/auth/return-path.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { safeReturnPath } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
test('account redirects stay local and preserve QR links', () => {
  for (const value of [null, '', 'https://evil.test', '//evil.test', '/\\evil.test', '/auth/callback', '/sign-in', '/reset-password']) {
    assert.equal(safeReturnPath(value), '/', String(value));
  }
  assert.equal(safeReturnPath('/?card=abc'), '/?card=abc');
  assert.equal(safeReturnPath('/?join=1'), '/?join=1');
});
