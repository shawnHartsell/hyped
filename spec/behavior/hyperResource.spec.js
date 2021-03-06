require( "../setup" );
var url = require( "../../src/urlTemplate.js" );
var HyperResource = require( "../../src/hyperResource.js" );

var resources = require( "./resources.js" );

describe( "Hyper Resource", function() {
	describe( "when rendering actions", function() {
		describe( "when rendering action with specific version", function() {
			var parameters = {
				page: { range: [ 1, 1 ] },
				size: { range: [ 1, 100 ] }
			};
			var expected = {
				id: 1,
				title: "test",
				_origin: { href: "/parent/2/1", method: "GET" },
				_resource: "parent",
				_action: "self",
				_version: 2,
				_links: {
					self: { href: "/parent/2/1", method: "GET" },
					children: { href: "/parent/1/child", method: "GET", parameters: parameters },
					"next-child-page": { href: "/parent/1/child?page=2&size=5", method: "GET", parameters: parameters },
					"create-child": { href: "/parent/1/child", method: "POST" }
				}
			};
			var response;
			var data = {
				id: 1,
				title: "test",
				description: "this is a test",
				children: [ {}, {}, {}, {}, {} ]
			};
			var requestData = {
				page: 1,
				size: 5
			};

			before( function() {
				var fn = HyperResource.resourceGenerator( resources, "", 2 );
				response = fn( "parent", "self", { data: requestData, version: 2 }, data, "", undefined, undefined, true );
			} );

			it( "should return the correct response", function() {
				return response.should.eventually.eql( expected );
			} );
		} );

		describe( "when rendering action without embedded resources", function() {
			var parameters = {
				page: { range: [ 1, 1 ] },
				size: { range: [ 1, 100 ] }
			};
			var expected = {
				id: 1,
				title: "test",
				description: "this is a test",
				children: [ {}, {}, {}, {}, {} ],
				_origin: { href: "/parent/1", method: "GET" },
				_resource: "parent",
				_action: "self",
				_version: 1,
				_links: {
					self: { href: "/parent/1", method: "GET" },
					children: { href: "/parent/1/child", method: "GET", parameters: parameters },
					"next-child-page": { href: "/parent/1/child?page=2&size=5", method: "GET", parameters: parameters },
					"create-child": { href: "/parent/1/child", method: "POST" }
				}
			};
			var response;
			var data = {
				id: 1,
				title: "test",
				description: "this is a test",
				children: [ {}, {}, {}, {}, {} ]
			};
			var requestData = {
				page: 1,
				size: 5
			};

			before( function() {
				var fn = HyperResource.resourceGenerator( resources );
				response = fn( "parent", "self", { data: requestData, version: 1 }, data, "", undefined, undefined, true );
			} );

			it( "should return the correct response", function() {
				return response.should.eventually.eql( expected );
			} );
		} );

		describe( "when rendering action with embedded resources including parent id in result", function() {
			var expected = require( "./actionWithEmbeddedResources.js" );
			var response;
			var data = {
				id: 2,
				parentId: 1,
				title: "child",
				grandChildren: [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 } ]
			};
			var envelope = {
				user: {
					name: "Evenly"
				},
				version: 1
			};
			before( function() {
				var fn1 = HyperResource.resourceGenerator( resources, { urlPrefix: "/test", apiPrefix: "/api" } );
				response = fn1( "child", "self", envelope, data, "", undefined, undefined, true );
			} );

			it( "should return the correct response", function() {
				return response.should.eventually.eql( expected );
			} );
		} );

		describe( "when rendering action with embedded resources and not using hal", function() {
			var response;
			var data = {
				id: 2,
				parentId: 1,
				title: "child",
				grandChildren: [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 } ]
			};
			var envelope = {
				user: {
					name: "Evenly"
				},
				version: 1
			};
			before( function() {
				var fn1 = HyperResource.resourceGenerator( resources, { urlPrefix: "/test", apiPrefix: "/api" } );
				response = fn1( "child", "self", envelope, data, "", undefined, undefined, false );
			} );

			it( "should keep embedded resources as top-level properties ", function() {
				return response.should.eventually.eql( {
					id: 2,
					parentId: 1,
					title: "child",
					grandChildren: [
						{ id: 1 },
						{ id: 2 },
						{ id: 3 },
						{ id: 4 },
						{ id: 5 }
					]
				} );
			} );
		} );

		describe( "when rendering action with embedded resources, with an empty array, and not using hal", function() {
			var response;
			var data = {
				id: 2,
				parentId: 1,
				title: "child",
				grandChildren: []
			};
			var envelope = {
				user: {
					name: "Evenly"
				}
			};
			before( function() {
				var fn1 = HyperResource.resourceGenerator( resources, { urlPrefix: "/test", apiPrefix: "/api" } );
				response = fn1( "child", "self", envelope, data, "", undefined, undefined, false );
			} );

			it( "should still render an empty array at the top-level", function() {
				return response.should.eventually.eql( {
					id: 2,
					parentId: 1,
					title: "child",
					grandChildren: []
				} );
			} );
		} );
	} );

	describe( "when rendering options including children and skipping auth check", function() {
		var expected = {
			_mediaTypes: [],
			_versions: [ "1", "2", "10" ],
			_links: {
				"parent:self": { href: "/parent/{id}", method: "GET", templated: true },
				"parent:list": { href: "/parent", method: "GET" },
				"parent:children": { href: "/parent/{id}/child", method: "GET", templated: true, parameters: {
						size: { range: [ 1, 100 ] }
					} },
				"parent:bogus": { href: "/parent/bogus", method: "GET" },
				"parent:privileged": { href: "/parent/privileged", method: "GET" },
				"child:create": { href: "/parent/{parentId}/child", method: "POST", templated: true },
				"child:self": { href: "/parent/{parentId}/child/{id}", method: "GET", templated: true },
				"child:change": { href: "/parent/{parentId}/child/{id}", method: "PUT", templated: true },
				"grandChild:self": { href: "/parent/{parentId}/child/{childId}/grand/{id}", method: "GET", templated: true },
				"grandChild:create": { href: "/parent/{parentId}/child/{childId}/grand", method: "POST", templated: true },
				"grandChild:delete": { href: "/parent/{parentId}/child/{childId}/grand/{id}", method: "DELETE", templated: true }
			}
		};
		var options;

		before( function() {
			var fn = HyperResource.optionsGenerator( resources, undefined, undefined, undefined, { user: {}, context: {} }, true );
			options = fn( {}, {} );
		} );

		it( "should render options correctly", function() {
			return options.should.eventually.eql( expected );
		} );
	} );

	describe( "when rendering options excluding children as generic user", function() {
		var expected = {
			_mediaTypes: [],
			_versions: [ "1", "2", "10" ],
			_links: {
				"parent:self": { href: "/parent/{id}", method: "GET", templated: true },
				"parent:list": { href: "/parent", method: "GET" },
				"parent:children": { href: "/parent/{id}/child", method: "GET", templated: true, parameters: {
						size: { range: [ 1, 100 ] }
					} }
			}
		};
		var options;
		var envelope = { user: {} };

		before( function() {
			var fn = HyperResource.optionsGenerator( resources, "", undefined, true, envelope );
			options = fn();
		} );

		it( "should render options correctly", function() {
			return options.should.eventually.eql( expected );
		} );

		it( "should not have called authorize on hidden action", function() {
			return should.not.exist( envelope.hiddenWasAuthorized );
		} );
	} );

	describe( "when rendering options (version 10) excluding children as generic user", function() {
		var expected = {
			_mediaTypes: [],
			_versions: [ "1", "2", "10" ],
			_links: {
				"parent:self": { href: "/parent/10/{id}", method: "GET", templated: true },
				"parent:list": { href: "/parent", method: "GET" },
				"parent:children": { href: "/parent/{id}/child", method: "GET", templated: true, parameters: {
						size: { range: [ 1, 100 ] }
					} }
			}
		};
		var options;
		var envelope = { user: {} };

		before( function() {
			var fn = HyperResource.optionsGenerator( resources, "", 10, true, envelope );
			options = fn();
		} );

		it( "should render options correctly", function() {
			return options.should.eventually.eql( expected );
		} );

		it( "should not have called authorize on hidden action", function() {
			return should.not.exist( envelope.hiddenWasAuthorized );
		} );
	} );

	describe( "when rendering options excluding children as admin", function() {
		var expected = {
			_mediaTypes: [],
			_versions: [ "1", "2", "10" ],
			_links: {
				"parent:self": { href: "/parent/{id}", method: "GET", templated: true },
				"parent:privileged": { href: "/parent/privileged", method: "GET" },
				"parent:list": { href: "/parent", method: "GET" },
				"parent:children": { href: "/parent/{id}/child", method: "GET", templated: true, parameters: {
						size: { range: [ 1, 100 ] }
					} }
			}
		};
		var options;

		before( function() {
			var fn = HyperResource.optionsGenerator( resources, "", undefined, true, { user: { name: "admin" } } );
			options = fn();
		} );

		it( "should render options correctly", function() {
			return options.should.eventually.eql( expected );
		} );
	} );

	describe( "when rendering a list of top-level resources", function() {
		var expected = require( "./topLevelResources.js" );
		var response;
		var data = [
			{
				id: 1,
				title: "one",
				description: "the first item",
				children: [ {} ]
			},
			{
				id: 2,
				title: "two",
				description: "the second item",
				children: [ {} ]
			}
		];

		before( function() {
			var fn1 = HyperResource.resourcesGenerator( resources );
			response = fn1( "parent", "self", { resource: "parent", action: "list", version: 1 }, data, "", "/parent", "GET", true );
		} );

		it( "should return the correct response", function() {
			return response.should.eventually.eql( expected );
		} );
	} );

	describe( "when rendering a list of top-level resources with metadata", function() {
		var expected = require( "./listWithMetadata.js" );
		var response;
		var data = {
			total: 2,
			description: "no need to argue, parents just don't understand",
			_list: [
				{
					id: 1,
					title: "one",
					description: "the first item",
					children: [ {} ]
				},
				{
					id: 2,
					title: "two",
					description: "the second item",
					children: [ {} ]
				}
			]
		};

		before( function() {
			var fn1 = HyperResource.resourcesGenerator( resources );
			response = fn1( "parent", "self", { resource: "parent", action: "list", version: 2 }, data, "", "/parent", "GET", true );
		} );

		it( "should return the correct response", function() {
			return response.should.eventually.eql( expected );
		} );
	} );

	describe( "when rendering an undefined response", function() {
		var response;
		var expected = require( "./listWithUndefined.js" );

		before( function() {
			var fn1 = HyperResource.resourcesGenerator( resources );
			response = fn1( "parent", "self", { resource: "parent", action: "list", version: 1 }, undefined, "", "/parent", "GET", true );
		} );

		it( "should return the correct response", function() {
			return response.should.eventually.eql( expected );
		} );
	} );

	describe( "when rendering a list of resources from another resource", function() {
		var expected = require( "./listFromOtherResource.js" );
		var response;
		var data = [
			{
				id: 1,
				parentId: 1,
				title: "one",
				description: "the first item"
			},
			{
				id: 2,
				parentId: 1,
				title: "two",
				description: "the second item"
			},
			{
				id: 3,
				parentId: 1,
				title: "three",
				description: "the third item"
			}
		];
		var elapsed;

		before( function() {
			var fn1 = HyperResource.resourcesGenerator( resources );
			var envelope = {
				data: {
					id: 1
				},
				user: {
					name: "Oddly"
				},
				resource: "parent",
				action: "children",
				version: 3
			};
			response = fn1( "child", "self", envelope, data, "", "/parent/1/child?page=1&size=5", "GET", true );
		} );

		it( "should return the correct response", function() {
			return response.should.eventually.eql( expected );
		} );
	} );
} );
