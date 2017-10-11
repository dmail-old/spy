const nowMs = () => Number(new Date())

let id = 0
const createAbstractCall = (spy, index) => {
	const call = {}
	const calledCallbacks = []

	let called = false
	let thisValue
	let temporalOrder
	let value
	const argsValue = []
	const msCreated = nowMs()
	let msInvoked

	const concretize = ({ context, args, returnValue } = {}) => {
		if (called) {
			throw new Error("can be concretized only once")
		}
		called = true
		// duration is not enough in case call are settled on the same ms
		id++
		temporalOrder = id
		msInvoked = nowMs()
		thisValue = context
		argsValue.push(...args)
		value = returnValue

		calledCallbacks.forEach(calledCallback => calledCallback(call))
		calledCallbacks.length = 0
	}
	const getDuration = () => msInvoked - msCreated
	const getTemporalOrder = () => temporalOrder
	const getThis = () => thisValue
	const getArguments = () => argsValue
	const getValue = () => value
	const wasCalled = () => called
	const wasCalledBefore = otherCall => temporalOrder > otherCall.getTemporalOrder()
	const toString = () => {
		if (index === 0) {
			return `${spy} first call`
		}
		if (index === 1) {
			return `${spy} second call`
		}
		if (index === 2) {
			return `${spy} third call`
		}
		return `${spy} call n°${index + 1}`
	}
	const whenCalled = fn => {
		if (called) {
			return fn(call)
		}
		calledCallbacks.push(fn)
	}

	Object.assign(call, {
		toString,
		concretize,
		getDuration,
		getTemporalOrder,
		getThis,
		getArguments,
		getValue,
		wasCalled,
		wasCalledBefore,
		whenCalled
	})

	return call
}

export const createSpy = fn => {
	const abstractCalls = []
	let abstractCallIndex = -1
	let prepareNextAbstractCall
	const spy = function() {
		const abstractCall = abstractCalls[abstractCallIndex]
		prepareNextAbstractCall()

		const context = this
		const args = arguments
		let returnValue
		if (fn && typeof fn === "function") {
			returnValue = fn.apply(context, args)
		}
		abstractCall.concretize({
			context,
			args,
			returnValue
		})

		return returnValue
	}

	const getOrCreateAbstractCall = index => {
		if (index in abstractCalls) {
			return abstractCalls[index]
		}
		const call = createAbstractCall(spy, index)
		abstractCalls[index] = call
		return call
	}
	const getCalls = () => abstractCalls.filter(({ wasCalled }) => wasCalled())
	const getCall = index => getCalls()[index]
	const getCallCount = () => getCalls().length
	const getFirstCall = () => getCalls()[0] || abstractCalls[0]
	const getLastCall = () => getCalls().reverse()[0] || abstractCalls[0]
	prepareNextAbstractCall = () => {
		abstractCallIndex++
		getOrCreateAbstractCall(abstractCallIndex)
	}

	// create abstract call in advance so that we can measure ms ellapsed between
	// an abstract call creation and when it actually called
	// this is very useful to measure time between calls for instance
	prepareNextAbstractCall()

	const toString = () => {
		if (fn && fn.name) {
			return `${fn.name} spy`
		}
		return `anonymous spy`
	}

	Object.assign(spy, {
		toString,
		getOrCreateAbstractCall,
		getCallCount,
		getCall,
		getFirstCall,
		getLastCall,
		getCalls
	})

	return spy
}
