import assert from "assert"

import { createSpy } from "./spy.js"

let someHasFailed = false
const ensure = (description, fn) => {
	process.stdout.write(`${description}: `)
	const returnValue = fn()
	if (returnValue === false) {
		someHasFailed = true
		process.stdout.write("failed\n")
	} else {
		process.stdout.write("passed\n")
	}
}

ensure("spy is a function", () => {
	assert.equal(typeof createSpy(), "function")
})

ensure("calling spy create a call", () => {
	const spy = createSpy()
	const thisValue = {}
	const args = [0, 1]
	spy.apply(thisValue, args)
	const call = spy.getCall(0)

	assert(call.wasCalled())
	assert.equal(call.getThis(), thisValue)
	assert.deepEqual(call.getArguments(), args)
	assert.equal(typeof call.getDuration(), "number")
})

ensure("calling spy call underlying function and return its returnvalue", () => {
	let calledWith = null
	const returnValue = {}
	const spy = createSpy((...args) => {
		calledWith = args
		return returnValue
	})
	const args = [0, 1]
	const spyReturnValue = spy(...args)
	assert.deepEqual(calledWith, args)
	assert.equal(spyReturnValue, returnValue)

	const call = spy.getCall(0)
	assert.equal(call.getValue(), returnValue)
})

ensure("spy toString", () => {
	const anonymousSpy = createSpy()
	assert.equal(anonymousSpy.toString(), "anonymous spy")

	const spyOnAnonymousFn = createSpy(() => {})
	assert.equal(spyOnAnonymousFn.toString(), "anonymous spy")

	const named = () => {}
	const spyOnNamedFunction = createSpy(named)
	assert.equal(spyOnNamedFunction.toString(), "named spy")
})

ensure("call.toString", () => {
	const spy = createSpy()

	assert.equal(spy.getOrCreateAbstractCall(0).toString(), "anonymous spy first call")
	assert.equal(spy.getOrCreateAbstractCall(1).toString(), "anonymous spy second call")
	assert.equal(spy.getOrCreateAbstractCall(2).toString(), "anonymous spy third call")
	assert.equal(spy.getOrCreateAbstractCall(3).toString(), "anonymous spy call n°4")
})

ensure("compare two call order", () => {
	const spy = createSpy()
	const firstCall = spy.getOrCreateAbstractCall(0)
	const secondCall = spy.getOrCreateAbstractCall(1)

	spy()
	spy()

	assert.equal(firstCall.wasCalledBefore(secondCall), false)
	assert.equal(secondCall.wasCalledBefore(firstCall), true)
})

ensure("register fn when a call gets called", () => {
	const spy = createSpy()
	const firstCall = spy.getOrCreateAbstractCall(0)
	let notified = false
	firstCall.whenCalled(() => {
		notified = true
	})
	assert.equal(notified, false)
	spy()
	assert.equal(notified, true)
	let notifiedImmediatly = false
	firstCall.whenCalled(() => {
		notifiedImmediatly = true
	})
	assert.equal(notifiedImmediatly, true)
})

ensure("call throw when concretized more than once", () => {
	const spy = createSpy()
	spy()
	const call = spy.getCall(0)

	assert.throws(() => {
		call.concretize()
	})
})

ensure("getCalls/getCallCount/getFirstCall/getLastCall returns only called abtrasct call", () => {
	const spy = createSpy()
	const firstCall = spy.getOrCreateAbstractCall(0)
	const secondCall = spy.getOrCreateAbstractCall(1)

	assert.equal(spy.getCallCount(), 0)
	assert.equal(spy.getFirstCall(), firstCall)
	assert.equal(spy.getLastCall(), firstCall)

	spy()
	spy()
	spy.getOrCreateAbstractCall(3)

	assert.equal(spy.getCallCount(), 2)
	assert.equal(spy.getFirstCall(), firstCall)
	assert.equal(spy.getLastCall(), secondCall)
})

process.exit(someHasFailed ? 1 : 0)
