const { GPU } = require('gpu.js');
const { gpuMock } = require('gpu-mock.js');
const { Sigmoid, sigmoid: sigmoidLayer, predict2D, predict3D, compare2D, compare3D } = require('../../src/layer/sigmoid');
const { expectFunction, shave } = require('../test-utils');
const sigmoidActivation = require('../../src/activation/sigmoid');
const { setup, teardown } = require('../../src/utilities/kernel');
const { injectIstanbulCoverage } = require('../test-utils');

describe('Sigmoid Layer', () => {
  describe('predict2D() (forward propagation)', () => {
    test('can sigmoid a simple matrix', () => {
      const inputs = [[0.1, 0.2, 0.3, 0.4], [0.5, 0.6, 0.7, 0.8], [0.9, 1, 1.1, 1.2]];
      const width = 4;
      const height = 3;
      const results = gpuMock(predict2D, { output: [width, height] })(inputs);
      expect(results.length).toBe(height);
      expect(results[0].length).toBe(width);
      expect(shave(results)).toEqual(shave([
        [0.52497917, 0.54983401, 0.57444251, 0.59868765],
        [0.62245935, 0.64565629, 0.66818780, 0.68997449],
        [0.71094948, 0.73105860, 0.75026011, 0.76852477],
      ]));
    });
  });

  describe('predict3D() (forward propagation)', () => {
    test('can sigmoid a simple matrix', () => {
      const inputs = [
        [[0.1, 0.2, 0.3, 0.4], [0.5, 0.6, 0.7, 0.8], [0.9, 1, 1.1, 1.2]],
        [[0.1, 0.2, 0.3, 0.4], [0.5, 0.6, 0.7, 0.8], [0.9, 1, 1.1, 1.2]],
      ];
      const width = 4;
      const height = 3;
      const depth = 2;
      const results = gpuMock(predict3D, { output: [width, height, depth] })(inputs);
      expect(results.length).toBe(depth);
      expect(results[0].length).toBe(height);
      expect(results[0][0].length).toBe(width);
      expect(shave(results)).toEqual(shave([
        [
          [0.52497917, 0.54983401, 0.57444251, 0.59868765],
          [0.62245935, 0.64565629, 0.66818780, 0.68997449],
          [0.71094948, 0.73105860, 0.75026011, 0.76852477],
        ],[
          [0.52497917, 0.54983401, 0.57444251, 0.59868765],
          [0.62245935, 0.64565629, 0.66818780, 0.68997449],
          [0.71094948, 0.73105860, 0.75026011, 0.76852477],
        ]
      ]));
    });
  });

  describe('compare2D (back propagation)', () => {
    test('can sigmoid a simple matrix', () => {
      const inputs = [[0.1, 0.2, 0.3, 0.4], [0.5, 0.6, 0.7, 0.8], [0.9, 1, 1.1, 1.2]];
      const deltas = [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]];
      const width = 4;
      const height = 3;
      const results = gpuMock(compare2D, { output: [width, height] })(inputs, deltas);

      expect(results.length).toBe(height);
      expect(results[0].length).toBe(width);
      expect(shave(results)).toEqual(shave([
        [0.09000000000000001, 0.16000000000000003, 0.20999999, 0.23999999],
        [0.25, 0.23999999, 0.20999999, 0.15999999999999998],
        [0.08999999999999998, 0.00000000, -0.11000000, -0.23999999],
      ]));
    });
  });

  describe('compare3D (back propagation)', () => {
    test('can sigmoid a simple matrix', () => {
      const inputs = [[[0.1, 0.2, 0.3, 0.4], [0.5, 0.6, 0.7, 0.8], [0.9, 1, 1.1, 1.2]],[[0.1, 0.2, 0.3, 0.4], [0.5, 0.6, 0.7, 0.8], [0.9, 1, 1.1, 1.2]]];
      const deltas = [[[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]],[[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]]];
      const width = 4;
      const height = 3;
      const depth = 2;
      const results = gpuMock(compare3D, { output: [width, height, depth] })(inputs, deltas);

      expect(results.length).toBe(depth);
      expect(results[0].length).toBe(height);
      expect(results[0][0].length).toBe(width);
      expect(shave(results)).toEqual(shave([
        [
          [0.09000000000000001, 0.16000000000000003, 0.20999999, 0.23999999],
          [0.25, 0.23999999, 0.20999999, 0.15999999999999998],
          [0.08999999999999998, 0.00000000, -0.11000000, -0.23999999],
        ], [
          [0.09000000000000001, 0.16000000000000003, 0.20999999, 0.23999999],
          [0.25, 0.23999999, 0.20999999, 0.15999999999999998],
          [0.08999999999999998, 0.00000000, -0.11000000, -0.23999999],
        ]
      ]));
    });
  });

  describe('.setupKernels()', () => {
    beforeEach(() => {
      setup(new GPU({
        mode: 'cpu',
        onIstanbulCoverageVariable: injectIstanbulCoverage
      }));
    });
    afterEach(() => {
      teardown();
    });
    describe('2d', () => {
      it('sets up kernels correctly', () => {
        const width = 3;
        const height = 4;
        const mockInputLayer = { width, height };
        const l = new Sigmoid(mockInputLayer);
        expect(l.predictKernel).toBe(null);
        expect(l.compareKernel).toBe(null);
        l.setupKernels();
        expect(l.predictKernel).not.toBe(null);
        expectFunction(l.predictKernel.source, predict2D);
        expect(l.predictKernel.output).toEqual([width, height]);
        expect(l.predictKernel.functions.length).toBe(1);
        expectFunction(l.predictKernel.functions[0].source, sigmoidActivation.activate);
        expect(l.compareKernel).not.toBe(null);
        expectFunction(l.compareKernel.source, compare2D);
        expect(l.compareKernel.output).toEqual([width, height]);
        expect(l.compareKernel.functions.length).toBe(1);
        expectFunction(l.compareKernel.functions[0].source, sigmoidActivation.measure);
      });
    });
    describe('3d', () => {
      it('sets up kernels correctly', () => {
        const width = 3;
        const height = 4;
        const depth = 5;
        const mockInputLayer = { width, height, depth };
        const l = new Sigmoid(mockInputLayer);
        expect(l.predictKernel).toBe(null);
        expect(l.compareKernel).toBe(null);
        l.setupKernels();
        expect(l.predictKernel).not.toBe(null);
        expectFunction(l.predictKernel.source, predict3D);
        expect(l.predictKernel.output).toEqual([width, height, depth]);
        expect(l.predictKernel.functions.length).toBe(1);
        expectFunction(l.predictKernel.functions[0].source, sigmoidActivation.activate);
        expect(l.compareKernel).not.toBe(null);
        expectFunction(l.compareKernel.source, compare3D);
        expect(l.compareKernel.output).toEqual([width, height, depth]);
        expect(l.compareKernel.functions.length).toBe(1);
        expectFunction(l.compareKernel.functions[0].source, sigmoidActivation.measure);
      });
    });
  });

  describe('.predict()', () => {
    it('calls this.predictKernel() with this.inputLayer.weights', () => {
      const mockWeights = {};
      const mockInputLayer = { weights: mockWeights, width: 1, height: 1, depth: 1 };
      const l = new Sigmoid(mockInputLayer);
      l.predictKernel = jest.fn(weights => weights);
      l.predict();
      expect(l.predictKernel).toBeCalledWith(mockWeights);
      expect(l.weights).toBe(mockWeights);
    });
  });

  describe('.compare()', () => {
    it('calls this.compareKernel() with this.inputLayer.weights & this.inputLayer.deltas', () => {
      const mockWeights = {};
      const mockDeltas = {};
      const mockInputLayer = {
        width: 1,
        height: 1,
        depth: 1
      };
      const l = new Sigmoid(mockInputLayer);
      l.weights = mockWeights;
      l.deltas = mockDeltas;
      l.compareKernel = jest.fn((weights, deltas) => deltas);
      l.compare();
      expect(l.compareKernel).toBeCalledWith(mockWeights, mockDeltas);
      expect(l.deltas).toBe(mockDeltas);
    });
  });

  describe('sigmoid lambda', () => {
    test('creates a new instance of Sigmoid', () => {
      const width = 3;
      const height = 4;
      const depth = 5;
      const mockInputLayer = { width, height, depth };
      const mockPraxisInstance = {};
      const mockPraxis = jest.fn(() => mockPraxisInstance);
      const settings = { praxis: mockPraxis };
      const l = sigmoidLayer(mockInputLayer, settings);
      expect(l.constructor).toBe(Sigmoid);
      expect(l.width).toBe(width);
      expect(l.height).toBe(height);
      expect(l.depth).toBe(depth);
      expect(mockPraxis).toBeCalled();
      expect(l.praxis).toBe(mockPraxisInstance);
    });
  });
});
