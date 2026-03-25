/**
 * Tests for replace_page_html, insert_image, get_page tools
 * Uses Node.js built-in test runner (node --test)
 *
 * Logic inlined from lib/agent.ts to avoid TypeScript compilation.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Helpers — extracted from tool execute fns in lib/agent.ts
// ---------------------------------------------------------------------------

function makeWPPage(id, title, rendered) {
  return {
    id,
    title: { rendered: title },
    content: { rendered },
    link: `https://example.com/?page_id=${id}`,
  };
}

/** get_page execute logic */
function execGetPage(page) {
  const isGutenberg = page.content.rendered.includes('<!-- wp:');
  const plainContent = page.content.rendered
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 2000);
  return {
    id: page.id,
    title: page.title.rendered,
    content: plainContent,
    url: page.link,
    is_gutenberg: isGutenberg,
    ...(isGutenberg ? { gutenberg_note: 'This page uses Gutenberg blocks. A full HTML rewrite will wrap your content in a Classic block.' } : {}),
  };
}

/** replace_page_html execute logic */
function execReplacePageHtml(page, { new_html, reason }) {
  const isGutenberg = page.content.rendered.includes('<!-- wp:');
  const wrappedHtml = isGutenberg
    ? `<!-- wp:html --><div class="rr-custom">${new_html}</div><!-- /wp:html -->`
    : new_html;
  return {
    page_id: page.id,
    page_title: page.title.rendered,
    field: 'content',
    old_value: page.content.rendered,
    new_value: wrappedHtml,
    is_gutenberg: isGutenberg,
    reason,
    status: 'awaiting_approval',
  };
}

/** insert_image execute logic */
function execInsertImage(page, { image_url, alt_text, position = 'after_intro', caption }) {
  const isGutenberg = page.content.rendered.includes('<!-- wp:');
  const currentContent = page.content.rendered;

  const figcaption = caption ? `<figcaption class="wp-element-caption">${caption}</figcaption>` : '';
  const imgHtml = `<figure class="wp-block-image"><img src="${image_url}" alt="${alt_text || ''}" />${figcaption}</figure>`;
  const imageBlock = isGutenberg ? `<!-- wp:image -->${imgHtml}<!-- /wp:image -->` : imgHtml;

  let newContent;
  if (position === 'top') {
    newContent = imageBlock + '\n' + currentContent;
  } else if (position === 'bottom') {
    newContent = currentContent + '\n' + imageBlock;
  } else {
    // after_intro: insert after first </p>
    const firstParaEnd = currentContent.indexOf('</p>');
    if (firstParaEnd === -1) {
      newContent = imageBlock + '\n' + currentContent;
    } else {
      const insertAt = firstParaEnd + 4;
      newContent = currentContent.slice(0, insertAt) + '\n' + imageBlock + currentContent.slice(insertAt);
    }
  }

  return {
    page_id: page.id,
    page_title: page.title.rendered,
    field: 'content',
    old_value: currentContent,
    new_value: newContent,
    is_gutenberg: isGutenberg,
    image_url,
    status: 'awaiting_approval',
  };
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const CLASSIC_CONTENT = '<p>Welcome to our site.</p><p>We do great work.</p>';
const GUTENBERG_CONTENT = '<!-- wp:paragraph --><p>Hello world.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Second para.</p><!-- /wp:paragraph -->';

const classicPage = makeWPPage(1, 'Home', CLASSIC_CONTENT);
const gutenbergPage = makeWPPage(2, 'About', GUTENBERG_CONTENT);
const emptyParaPage = makeWPPage(3, 'Empty', '<div>No paragraph here</div>');

// ---------------------------------------------------------------------------
// get_page tests
// ---------------------------------------------------------------------------

describe('get_page — Gutenberg detection', () => {
  test('classic page: is_gutenberg=false, no gutenberg_note', () => {
    const result = execGetPage(classicPage);
    assert.equal(result.is_gutenberg, false);
    assert.equal(result.gutenberg_note, undefined);
    assert.equal(result.id, 1);
    assert.equal(result.title, 'Home');
    assert.ok(result.content.length > 0);
  });

  test('gutenberg page: is_gutenberg=true with gutenberg_note', () => {
    const result = execGetPage(gutenbergPage);
    assert.equal(result.is_gutenberg, true);
    assert.ok(result.gutenberg_note, 'gutenberg_note should be present');
    assert.ok(result.gutenberg_note.includes('Classic block'), 'note should mention Classic block');
  });

  test('content is stripped of HTML tags', () => {
    const result = execGetPage(classicPage);
    assert.ok(!result.content.includes('<p>'), 'HTML tags should be stripped');
    assert.ok(result.content.includes('Welcome'), 'text content should remain');
  });

  test('content is truncated at 2000 chars', () => {
    const longPage = makeWPPage(99, 'Long', '<p>' + 'x'.repeat(5000) + '</p>');
    const result = execGetPage(longPage);
    assert.ok(result.content.length <= 2000, `content length should be ≤2000, got ${result.content.length}`);
  });
});

// ---------------------------------------------------------------------------
// replace_page_html tests
// ---------------------------------------------------------------------------

describe('replace_page_html', () => {
  const newHtml = '<section><h2>New Heading</h2><p>Fresh content</p></section>';

  test('classic page: new_html passed through unchanged', () => {
    const result = execReplacePageHtml(classicPage, { new_html: newHtml });
    assert.equal(result.new_value, newHtml);
    assert.equal(result.is_gutenberg, false);
    assert.equal(result.status, 'awaiting_approval');
    assert.equal(result.field, 'content');
  });

  test('gutenberg page: wraps new HTML in <!-- wp:html --> Classic block', () => {
    const result = execReplacePageHtml(gutenbergPage, { new_html: newHtml });
    assert.equal(result.is_gutenberg, true);
    assert.ok(result.new_value.startsWith('<!-- wp:html -->'), 'should start with Gutenberg html block open');
    assert.ok(result.new_value.endsWith('<!-- /wp:html -->'), 'should end with Gutenberg html block close');
    assert.ok(result.new_value.includes(newHtml), 'should contain the new HTML');
    assert.ok(result.new_value.includes('rr-custom'), 'should include rr-custom wrapper div');
  });

  test('returns old_value equal to original page content', () => {
    const result = execReplacePageHtml(gutenbergPage, { new_html: newHtml });
    assert.equal(result.old_value, GUTENBERG_CONTENT);
  });

  test('carries page_id, page_title, reason', () => {
    const result = execReplacePageHtml(classicPage, { new_html: newHtml, reason: 'Full redesign' });
    assert.equal(result.page_id, 1);
    assert.equal(result.page_title, 'Home');
    assert.equal(result.reason, 'Full redesign');
  });

  test('reason is optional — no error without it', () => {
    assert.doesNotThrow(() => execReplacePageHtml(classicPage, { new_html: newHtml }));
  });
});

// ---------------------------------------------------------------------------
// insert_image tests
// ---------------------------------------------------------------------------

describe('insert_image — markup building', () => {
  const imgUrl = 'https://example.com/photo.jpg';

  test('classic page: image is plain figure element (no Gutenberg wrapper)', () => {
    const result = execInsertImage(classicPage, { image_url: imgUrl });
    assert.equal(result.is_gutenberg, false);
    assert.ok(!result.new_value.includes('<!-- wp:image -->'), 'classic page should not have wp:image block comment');
    assert.ok(result.new_value.includes('<figure class="wp-block-image">'), 'should have figure element');
  });

  test('gutenberg page: image wrapped in <!-- wp:image --> block', () => {
    const result = execInsertImage(gutenbergPage, { image_url: imgUrl });
    assert.equal(result.is_gutenberg, true);
    assert.ok(result.new_value.includes('<!-- wp:image -->'), 'should have wp:image open comment');
    assert.ok(result.new_value.includes('<!-- /wp:image -->'), 'should have wp:image close comment');
  });

  test('alt_text is set on img element', () => {
    const result = execInsertImage(classicPage, { image_url: imgUrl, alt_text: 'Team photo' });
    assert.ok(result.new_value.includes('alt="Team photo"'), 'alt text should be in img tag');
  });

  test('empty alt_text when not provided', () => {
    const result = execInsertImage(classicPage, { image_url: imgUrl });
    assert.ok(result.new_value.includes('alt=""'), 'empty alt should be present');
  });

  test('caption renders as figcaption with correct class', () => {
    const result = execInsertImage(classicPage, { image_url: imgUrl, caption: 'Our team' });
    assert.ok(result.new_value.includes('<figcaption class="wp-element-caption">Our team</figcaption>'));
  });

  test('no figcaption when caption is omitted', () => {
    const result = execInsertImage(classicPage, { image_url: imgUrl });
    assert.ok(!result.new_value.includes('<figcaption'), 'no figcaption without caption');
  });

  test('status is awaiting_approval', () => {
    const result = execInsertImage(classicPage, { image_url: imgUrl });
    assert.equal(result.status, 'awaiting_approval');
  });

  test('field is content', () => {
    const result = execInsertImage(classicPage, { image_url: imgUrl });
    assert.equal(result.field, 'content');
  });
});

describe('insert_image — position handling', () => {
  const imgUrl = 'https://example.com/img.png';

  test('position=top: image block is prepended before existing content', () => {
    const result = execInsertImage(classicPage, { image_url: imgUrl, position: 'top' });
    assert.ok(result.new_value.startsWith('<figure'), 'should start with image figure');
    assert.ok(result.new_value.includes(CLASSIC_CONTENT), 'original content should follow');
  });

  test('position=bottom: image block is appended after existing content', () => {
    const result = execInsertImage(classicPage, { image_url: imgUrl, position: 'bottom' });
    assert.ok(result.new_value.endsWith('</figure>'), 'should end with figure close');
    assert.ok(result.new_value.startsWith('<p>'), 'original content should come first');
  });

  test('position=after_intro (default): inserts after first </p>', () => {
    const result = execInsertImage(classicPage, { image_url: imgUrl, position: 'after_intro' });
    const firstPEnd = result.new_value.indexOf('</p>');
    const figIdx = result.new_value.indexOf('<figure', firstPEnd);
    assert.ok(figIdx > firstPEnd, 'figure should come after first </p>');
    // Original second paragraph should still be present
    assert.ok(result.new_value.includes('We do great work'), 'second paragraph should still exist');
  });

  test('after_intro falls back to top when no </p> found', () => {
    const result = execInsertImage(emptyParaPage, { image_url: imgUrl });
    assert.ok(result.new_value.startsWith('<figure'), 'should prepend when no paragraph found');
  });

  test('original content is preserved as old_value', () => {
    const result = execInsertImage(classicPage, { image_url: imgUrl, position: 'bottom' });
    assert.equal(result.old_value, CLASSIC_CONTENT);
  });
});

// ---------------------------------------------------------------------------
// ChatInterface rendering — logic tests (tool condition checks)
// ---------------------------------------------------------------------------

describe('ChatInterface tool rendering conditions', () => {
  // Simulate the condition used in ChatInterface.tsx:
  // (tool.toolName === 'propose_change' || tool.toolName === 'replace_page_html' || tool.toolName === 'insert_image')
  // && tool.result.status === 'awaiting_approval'

  function shouldRenderDiffPreview(toolName, result) {
    return (
      (toolName === 'propose_change' || toolName === 'replace_page_html' || toolName === 'insert_image') &&
      result.status === 'awaiting_approval'
    );
  }

  test('replace_page_html result triggers DiffPreview', () => {
    const result = execReplacePageHtml(classicPage, { new_html: '<p>New</p>' });
    assert.ok(shouldRenderDiffPreview('replace_page_html', result));
  });

  test('insert_image result triggers DiffPreview', () => {
    const result = execInsertImage(classicPage, { image_url: 'https://example.com/x.jpg' });
    assert.ok(shouldRenderDiffPreview('insert_image', result));
  });

  test('propose_change result triggers DiffPreview', () => {
    const result = { status: 'awaiting_approval' };
    assert.ok(shouldRenderDiffPreview('propose_change', result));
  });

  test('deploy_change does not trigger DiffPreview', () => {
    const result = { action: 'deploy_requested' };
    assert.ok(!shouldRenderDiffPreview('deploy_change', result));
  });

  test('get_page does not trigger DiffPreview', () => {
    const result = execGetPage(classicPage);
    assert.ok(!shouldRenderDiffPreview('get_page', result));
  });
});
