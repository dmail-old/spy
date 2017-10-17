import { test } from "@dmail/test-cheap"
import assert from "assert"
import { install } from "lolex"
import { createSpy } from "./spy.js"

test("spy.js", ({ ensure }) => {
	const clock = install()

	ensure("spy is a function", () => {
		assert.equal(typeof createSpy(), "function")
	})

	ensure("spy.getCall() returns object with call information", () => {
		let calledWith = null
		const returnValue = {}
		const spy = createSpy((...args) => {
			calledWith = args
			return returnValue
		})
		const thisValue = {}
		const args = [0, 1]
		const uncalledCall = spy.getCall(0)

		assert.deepEqual(uncalledCall, {
			absoluteOrder: undefined,
			msCreated: Date.now(),
			msCalled: undefined,
			called: false,
			thisValue: undefined,
			argValues: undefined,
			returnValue: undefined
		})

		const ellapsedMs = 10
		clock.tick(ellapsedMs)
		spy.apply(thisValue, args)
		const calledCall = spy.getCall(0)

		assert.deepEqual(calledWith, args)
		assert.deepEqual(calledCall, {
			absoluteOrder: 1, // kinda risky but it works as long a noting is calling a spy before this one
			msCreated: Date.now(),
			msCalled: calledCall.msCreated + ellapsedMs,
			called: true,
			thisValue,
			argValues: args,
			returnValue
		})
	})

	ensure("spy.toString()", () => {
		const anonymousSpy = createSpy()
		assert.equal(anonymousSpy.toString(), "anonymous spy")

		const spyOnAnonymousFn = createSpy(() => {})
		assert.equal(spyOnAnonymousFn.toString(), "anonymous spy")

		const namedFunciton = () => {}
		const spyOnNamedFunction = createSpy(namedFunciton)
		assert.equal(spyOnNamedFunction.toString(), "named spy")

		const spyNamed = createSpy("foo")
		assert.equal(spyNamed.toString(), "foo spy")
	})

	ensure("tracker.toString()", () => {
		const spy = createSpy()

		assert.equal(spy.track(0).toString(), "anonymous spy first call")
		assert.equal(spy.track(1).toString(), "anonymous spy second call")
		assert.equal(spy.track(2).toString(), "anonymous spy third call")
		assert.equal(spy.track(3).toString(), "anonymous spy call n°4")
	})

	ensure("compare two call order", () => {
		const spy = createSpy()

		spy()
		spy()

		const firstCall = spy.getCall(0)
		const secondCall = spy.getCall(1)

		assert(firstCall.absoluteOrder < secondCall.absoluteOrder)
	})

	ensure("tracker.whenCalled(fn) calls fn as soon as call occurs", () => {
		const spy = createSpy()
		const firstCallTracker = spy.track(0)
		let call
		firstCallTracker.whenCalled(report => {
			call = report
		})
		assert.equal(call, undefined)
		spy()
		assert.equal(call.called, true)

		let immediateCall
		firstCallTracker.whenCalled(report => {
			immediateCall = report
		})
		assert.equal(immediateCall.called, true)
		assert(call !== immediateCall)
	})

	ensure("tracker.notify() throws when called more than once", () => {
		const spy = createSpy()
		spy()
		const tracker = spy.track(0)

		assert.throws(() => {
			tracker.notify()
		})
	})

	ensure("spy.getCalls() returns only called tracker reports", () => {
		const spy = createSpy()

		spy.track(0)
		spy.track(1)
		spy()

		assert.equal(spy.getCalls().length, 1)
	})

	ensure("spy.getCallCount() returns amount of calls", () => {
		const spy = createSpy()

		spy.track(0)
		spy.track(1)

		assert.equal(spy.getCallCount(), 0)
		spy()
		assert.equal(spy.getCallCount(), 1)
	})

	ensure("spy.getFirstCall() returns the first call report, called or not", () => {
		const spy = createSpy()
		assert.equal(spy.getFirstCall().called, false)
		spy()
		assert.equal(spy.getFirstCall().called, true)
	})

	ensure("spy.getLastCall() returns the last called report", () => {
		const spy = createSpy()
		spy.track(0)
		spy.track(1)
		spy.track(2)
		assert.equal(spy.getLastCall().called, false)
		spy("a")
		spy("b")
		assert.equal(spy.getLastCall().argValues[0], "b")
	})

	clock.uninstall()
})
