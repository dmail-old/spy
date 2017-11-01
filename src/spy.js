const nowMs = () => Number(new Date())

let id = 0
const createTracker = (spy, index) => {
	const tracker = {}
	const calledCallbacks = []

	const msCreated = nowMs()
	let called = false
	let msCalled
	let thisValue
	let absoluteOrder
	let argValues
	let returnValue

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
	const createReport = () => ({
		msCreated,
		msCalled,
		called,
		absoluteOrder,
		thisValue,
		argValues,
		returnValue
	})
	const whenCalled = fn => {
		if (called) {
			return fn(createReport())
		}
		calledCallbacks.push(fn)
	}
	const notify = data => {
		if (called) {
			throw new Error("can be concretized only once")
		}
		msCalled = nowMs()
		called = true
		// duration is not enough in case tracker are called on the same ms
		// we need an absolute counter to be sure of the call order
		id++
		absoluteOrder = id
		;({ thisValue, argValues, returnValue } = data)

		calledCallbacks.forEach(calledCallback => calledCallback(createReport()))
		calledCallbacks.length = 0
	}

	Object.assign(tracker, {
		toString,
		createReport,
		whenCalled,
		notify
	})

	return tracker
}

export const createSpy = firstArg => {
	let name
	let fn
	if (typeof firstArg === "string") {
		name = firstArg
	} else if (typeof firstArg === "function") {
		fn = firstArg
		name = firstArg.name || "anonymous"
	} else {
		name = "anonymous"
	}

	const trackers = []
	let trackerIndex = -1
	let prepareNextTracker
	const call = function() {
		const tracker = trackers[trackerIndex]
		prepareNextTracker()

		const thisValue = this
		const argValues = Array.prototype.slice.call(arguments)
		let returnValue
		if (fn && typeof fn === "function") {
			returnValue = fn.apply(thisValue, argValues)
		}
		tracker.notify({
			thisValue,
			argValues,
			returnValue
		})

		return returnValue
	}
	const spy = function() {
		return call.apply(this, arguments)
	}
	const track = index => {
		if (index in trackers) {
			return trackers[index]
		}
		const tracker = createTracker(spy, index)
		trackers[index] = tracker
		return tracker
	}
	const getReports = () => trackers.map(({ createReport }) => createReport())
	const getReport = index => trackers[index].createReport()
	const getCalledReports = () => getReports().filter(({ called }) => called)
	const getCallCount = () => getCalledReports().length
	const getFirstCalledReport = () => getCalledReports()[0] || null
	const getLastCalledReport = () => getCalledReports().reverse()[0] || null
	prepareNextTracker = () => {
		trackerIndex++
		track(trackerIndex)
	}

	// create abstract call in advance so that we can measure ms ellapsed between
	// an abstract call creation and when it actually called
	// this is very useful to measure time between calls for instance
	prepareNextTracker()

	const toString = () => `${name} spy`

	Object.assign(spy, {
		toString,
		call,
		track,
		getReport,
		getReports,
		getCalledReports,
		getCallCount,
		getFirstCalledReport,
		getLastCalledReport
	})

	return spy
}

export const createPropertyHelpers = object => {
	const hasProperty = name => object.hasOwnProperty(name)
	const getProperty = name => object[name]
	const setProperty = (name, value) => {
		const has = hasProperty(name)
		const old = has ? getProperty(name) : undefined
		object[name] = value
		const restoreProperty = () => {
			if (has) {
				object[name] = old
			} else {
				delete object[name]
			}
		}
		return restoreProperty
	}

	return {
		has: hasProperty,
		get: getProperty,
		set: setProperty
	}
}

export const installSpy = (spy, object, name, fn) => {
	const { set } = createPropertyHelpers(object)
	const restore = set(name, spy)

	try {
		fn()
	} finally {
		restore()
	}
}
