// Copyright 2008 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

// Flags: --expose-debug-as debug --expose-gc --send-idle-notification
// Flags: --allow-natives-syntax --expose-natives-as natives
// Flags: --noharmony-shipping
// Flags: --nostress-opt

// --nostress-opt is specified because in stress mode the compilation cache
// may hold on to old copies of scripts (see bug 1641).

// Note: this test checks that that the number of scripts reported as native
// by Debug.scripts() is the same as a number of core native scripts.
// Native scripts that are added by --harmony-shipping are classified
// as 'experimental', but are still returned by Debug.scripts(), so
// we disable harmony-shipping for this test

// Get the Debug object exposed from the debug context global object.
Debug = debug.Debug;
Debug.setListener(function(){});

Date();
RegExp();

// Count script types.
var named_native_count = 0;
var named_native_names = {};
var extension_count = 0;
var normal_count = 0;
var scripts = Debug.scripts();
for (i = 0; i < scripts.length; i++) {
  if (scripts[i].type == Debug.ScriptType.Native) {
    if (scripts[i].name) {
      // TODO(1641): Remove check for equally named native scripts once the
      // underlying issue is fixed.
      if (!named_native_names[scripts[i].name]) {
        named_native_names[scripts[i].name] = true;
        named_native_count++;
      }
    }
  } else if (scripts[i].type == Debug.ScriptType.Extension) {
    extension_count++;
  } else if (scripts[i].type == Debug.ScriptType.Normal) {
    normal_count++;
  } else {
    assertUnreachable('Unexpected type ' + scripts[i].type);
  }
}

// This has to be updated if the number of native scripts change.
assertEquals(%NativeScriptsCount(), named_native_count);
// The 'gc' extension and one or two extras scripts are loaded.
assertTrue(extension_count == 2 || extension_count == 3);
// This script and mjsunit.js has been loaded.  If using d8, d8 loads
// a normal script during startup too.
assertTrue(normal_count == 2 || normal_count == 3);

// Test a builtins script.
var array_script = Debug.findScript('native array.js');
assertEquals('native array.js', array_script.name);
assertEquals(Debug.ScriptType.Native, array_script.type);

// Test a debugger script.
var debug_delay_script = Debug.findScript('native debug.js');
assertEquals('native debug.js', debug_delay_script.name);
assertEquals(Debug.ScriptType.Native, debug_delay_script.type);

// Test an extension script.
var extension_gc_script = Debug.findScript('v8/gc');
if (extension_gc_script) {
  assertEquals('v8/gc', extension_gc_script.name);
  assertEquals(Debug.ScriptType.Extension, extension_gc_script.type);
}

// Test a normal script.
var debug_script = Debug.findScript(/debug-script.js/);
assertTrue(/debug-script.js/.test(debug_script.name));
assertEquals(Debug.ScriptType.Normal, debug_script.type);

// Check a nonexistent script.
var dummy_script = Debug.findScript('dummy.js');
assertTrue(typeof dummy_script == 'undefined');

Debug.setListener(null);
