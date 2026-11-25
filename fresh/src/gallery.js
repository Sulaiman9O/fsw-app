/* Component gallery (owner only, Settings → Design gallery): every shared component in every state.
   Open it after any design change, in English and Arabic, light and dark. See DESIGN.md. */
SCREENS.gallery=m=>{const sec=t=>`<div class="ops-sec"><b>${t}</b></div>`;
  const sw=(n,l)=>`<div class="gsw"><i style="background:var(${n})"></i><span>${l}</span><small>${n}</small></div>`;
  m.innerHTML=head('Design gallery')+
  sec('Colours')+`<div class="ggrid">${[['--c-bg','Background'],['--c-surface','Surface'],['--c-text','Text'],['--c-text-muted','Muted text'],['--c-border','Border'],['--c-primary','Primary'],['--c-primary-tint','Primary tint'],['--c-success','Success'],['--c-warning','Warning'],['--c-danger','Danger']].map(([n,l])=>sw(n,l)).join('')}</div>`+
  sec('Text')+`<div class="card">${[['--t-7','Total 33.600'],['--t-6','Screen number'],['--t-5','Screen title'],['--t-4','Section'],['--t-3','Body text · نص عادي'],['--t-2','Secondary · نص ثانوي'],['--t-1','Smallest (Latin only)']].map(([n,l])=>`<div style="font-size:var(${n});font-weight:${n<'--t-4'?600:800}">${l} <small>${n}</small></div>`).join('')}</div>`+
  sec('Buttons')+`<button class="btn">${icon('receipt')} Primary</button><button class="btn" disabled>Primary · disabled</button><button class="btn sec">Secondary</button><button class="btn ghost sm">Secondary small</button><button class="btn danger">${icon('trash-2')} Danger</button><button class="lnk">Text link ${icon('chevron-right')}</button>`+
  sec('Fields')+`<div class="field-l">Label above the field</div><input class="field" placeholder="Placeholder"><div class="field-l">With a value</div><input class="field" value="148,200">`+
  sec('Choices')+`<div class="chips"><button aria-pressed="true">Selected</button><button aria-pressed="false">Choice</button><button aria-pressed="false">Choice</button></div>`+
  sec('Rows')+`<div class="list"><button class="row"><div><b>Row title</b><span>Second line</span></div><span class="v">12.600</span></button><button class="row"><div><b>Row title</b><span>Second line</span></div><span class="v">›</span></button></div><button class="mitem"><div><b>Menu row</b><span>Explains where it goes</span></div><span class="v">›</span></button>`+
  sec('Status')+`<div class="chipsrow"><span class="tag">Working</span> <span class="tag" style="--dot:var(--c-success)">Ready</span> <span class="kt">Part</span> <span class="kt">Labour</span></div>`+
  sec('Messages')+`<button class="btn sec" id="gto">Show the short message</button><button class="btn sec" id="gun">Show Undo</button><button class="btn sec" id="gsh">Open a sheet</button><button class="btn sec" id="gcf">Open a confirm</button>`+
  sec('Icons')+`<div class="ggrid ic6">${Object.keys(SF_ICONS).map(n=>`<div class="gsw">${icon(n)}<small>${n}</small></div>`).join('')}</div>`;
  $('#gto').onclick=()=>toast('Saved');$('#gun').onclick=()=>undoBar('Marked ready',()=>toast('Undone'));
  $('#gsh').onclick=()=>openSheet(`<h3>Sheet title</h3><div class="field-l">Amount</div><input class="field" inputmode="decimal" value="1.000"><button class="btn">Save</button>`);
  $('#gcf').onclick=()=>confirmSheet('Delete job #5?','Delete job #5',()=>toast('Deleted'));};
(function(){const _st=SCREENS.settings;SCREENS.settings=function(m){const r=_st.apply(this,arguments);if(S.user&&S.user.role==='owner'&&!m.querySelector('#ggo')){const b=document.createElement('button');b.className='mitem';b.id='ggo';b.innerHTML=`<div><b>Design gallery</b><span>Every button, field and colour in one place</span></div><span class="v">›</span>`;b.onclick=()=>go('gallery');m.appendChild(b);}return r;};})();
Object.assign(AR_DICT,{'Design gallery':'معرض التصميم','Every button, field and colour in one place':'كل زر وحقل ولون في مكان واحد'});
