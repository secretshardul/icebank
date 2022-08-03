import anyTest, { TestFn } from 'ava'

export const test = anyTest as TestFn<{
}>

test.before(async t => {
  t.log('gg')
})