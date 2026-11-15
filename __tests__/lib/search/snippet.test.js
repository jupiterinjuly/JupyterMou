import {getSearchSnippet} from '@/lib/search/snippet'

test('removes provider highlight tags while retaining literal code as text',()=>{
  expect(getSearchSnippet({_snippetResult:{content:{value:'&lt;em&gt;源码&lt;/em&gt; <em>命中</em> &amp; &lt;script&gt;'}}})).toBe('<em>源码</em> 命中 & <script>')
})

test('handles legacy results without provider snippets',()=>{
  expect(getSearchSnippet({content:'正文'})).toBe('正文')
  expect(getSearchSnippet({})).toBe('')
})
