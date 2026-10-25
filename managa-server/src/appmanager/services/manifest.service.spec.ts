import { BadRequestException } from '@nestjs/common';
import { ManifestService } from './manifest.service';

describe('ManifestService MCP support', () => {
  const service = new ManifestService();

  it('normalizes an app-owned MCP endpoint', () => {
    const manifest = service.normalize(
      {
        name: 'Taska',
        server: { dir: 'server', start: 'npm start' },
        mcp: { component: 'server', path: '/mcp', namespace: 'taska' },
      },
      'taska',
    );

    expect(manifest.mcp).toEqual({
      component: 'server',
      path: '/mcp',
      namespace: 'taska',
    });
  });

  it('defaults the component to server and the namespace to the app id', () => {
    const manifest = service.normalize(
      {
        id: 'my-app',
        name: 'My App',
        server: { dir: 'server', start: 'npm start' },
        mcp: {},
      },
      'fallback',
    );

    expect(manifest.mcp).toEqual({
      component: 'server',
      path: '/mcp',
      namespace: 'my-app',
    });
  });

  it('rejects an MCP component that does not exist', () => {
    expect(() =>
      service.normalize(
        {
          name: 'Client Only',
          client: { dir: 'client', start: 'npm start' },
          mcp: { component: 'server' },
        },
        'client-only',
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects unsafe MCP paths', () => {
    expect(() =>
      service.normalize(
        {
          name: 'Bad MCP',
          server: { dir: 'server', start: 'npm start' },
          mcp: { path: '/../secret' },
        },
        'bad-mcp',
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects a non-object MCP declaration', () => {
    expect(() =>
      service.normalize(
        {
          name: 'Bad MCP',
          server: { dir: 'server', start: 'npm start' },
          mcp: [] as never,
        },
        'bad-mcp',
      ),
    ).toThrow(BadRequestException);
  });
});
